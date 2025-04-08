
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import { startOfWeek, endOfWeek } from "https://esm.sh/date-fns@2.30.0";

// Configure CORS headers for the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle incoming requests
serve(async (req) => {
  console.log("get_weekly_progress function invoked");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating Supabase client");
    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the JWT from the request to verify the user
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.error("No authorization token provided");
      return new Response(
        JSON.stringify({ error: "No authorization token provided" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the JWT and get the user
    console.log("Verifying user token");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed", details: authError }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Authenticated user:", user.id);

    // Parse the request body to get client_id
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    let { client_id } = requestBody;
    
    // Use authenticated user id if client_id not provided
    client_id = client_id || user.id;
    console.log("Using client_id:", client_id);

    // 1. Get current date info
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    
    // ISO format for database queries
    const weekStartISO = weekStart.toISOString();
    const weekEndISO = weekEnd.toISOString();
    console.log(`Week range: ${weekStartISO} to ${weekEndISO}`);
    
    // 2. Get client's current active program
    console.log("Fetching program assignment");
    const { data: programAssignment, error: programError } = await supabaseClient
      .from('program_assignments')
      .select(`
        id,
        program_id,
        start_date,
        end_date,
        program:program_id(
          id,
          title,
          weeks,
          description
        )
      `)
      .eq('user_id', client_id)
      .is('end_date', null) // Active programs don't have end dates
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (programError) {
      console.error("Error fetching program assignment:", programError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch program assignment", details: programError }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (!programAssignment) {
      console.error("No active program found for client");
      return new Response(
        JSON.stringify({ 
          error: "No active program found",
          program_id: "",
          program_title: "No Program",
          current_week: 1,
          total_weeks: 1,
          program_type: "moai_strength",
          metrics: {
            strength_workouts: { target: 0, actual: 0 },
            strength_mobility: { target: 0, actual: 0 },
            miles_run: { target: 0, actual: 0 },
            cardio_minutes: { target: 0, actual: 0 }
          }
        }),
        {
          status: 200, // Return 200 with empty data instead of 404
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Found program assignment:", programAssignment.id);
    console.log("Program:", programAssignment.program?.title);
    
    // 3. Calculate which program week we're in
    const programStartDate = new Date(programAssignment.start_date);
    const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceStart = Math.floor((today.getTime() - programStartDate.getTime()) / millisecondsPerWeek) + 1;
    
    // Ensure week number is within program bounds
    const currentWeekNumber = Math.min(
      Math.max(1, weeksSinceStart), 
      programAssignment.program?.weeks || 4
    );
    
    console.log("Current week number:", currentWeekNumber);

    // 4. Get workouts for the specific week from program_weeks and workouts tables
    console.log(`Fetching workouts for week ${currentWeekNumber} of program ${programAssignment.program_id}`);
    
    // First get the week ID for the current week number
    const { data: weekData, error: weekError } = await supabaseClient
      .from('workout_weeks')
      .select('id')
      .eq('program_id', programAssignment.program_id)
      .eq('week_number', currentWeekNumber)
      .maybeSingle();
    
    if (weekError) {
      console.error(`Error fetching week ${currentWeekNumber}:`, weekError);
    }
    
    if (!weekData) {
      console.error(`Week ${currentWeekNumber} not found in program ${programAssignment.program_id}`);
    }
    
    // Now get workouts for this specific week
    let assignedWorkouts = [];
    let strengthWorkoutsCount = 0;
    let mobilityWorkoutsCount = 0;
    
    if (weekData?.id) {
      const { data: workouts, error: workoutsError } = await supabaseClient
        .from('workouts')
        .select(`
          id, 
          workout_type
        `)
        .eq('week_id', weekData.id);
      
      if (workoutsError) {
        console.error("Error fetching workouts for week:", workoutsError);
      } else {
        assignedWorkouts = workouts || [];
        // Count specific workout types
        strengthWorkoutsCount = assignedWorkouts.filter(
          workout => workout.workout_type === 'strength' || workout.workout_type === 'bodyweight'
        ).length;
        
        mobilityWorkoutsCount = assignedWorkouts.filter(
          workout => workout.workout_type === 'flexibility'
        ).length;
        
        console.log(`Found ${assignedWorkouts.length} total assigned workouts for week ${currentWeekNumber}`);
        console.log(`Found ${strengthWorkoutsCount} strength workouts and ${mobilityWorkoutsCount} mobility workouts`);
      }
    }
    
    // Fetch target metrics from workout_weeks table if available
    let targetMilesRun = 0;
    let targetCardioMinutes = 60; // Default value
    
    if (weekData?.id) {
      console.log(`Fetching target metrics for week ${currentWeekNumber}`);
      const { data: weekMetrics, error: metricsError } = await supabaseClient
        .from('workout_weeks')
        .select('target_miles_run, target_cardio_minutes')
        .eq('id', weekData.id)
        .maybeSingle();
        
      if (metricsError) {
        console.error("Error fetching week metrics:", metricsError);
      } else if (weekMetrics) {
        console.log("Found week metrics:", weekMetrics);
        targetMilesRun = Number(weekMetrics.target_miles_run) || 0;
        targetCardioMinutes = Number(weekMetrics.target_cardio_minutes) || 60;
      }
    }
    
    // 5. Fetch completed workouts for the week
    console.log("Fetching workout completions");
    const { data: workoutCompletions, error: workoutsError } = await supabaseClient
      .from('workout_completions')
      .select(`
        id,
        user_id,
        workout_id,
        completed_at,
        workout_type,
        distance,
        duration,
        location,
        title
      `)
      .eq('user_id', client_id)
      .gte('completed_at', weekStartISO)
      .lte('completed_at', weekEndISO)
      .not('completed_at', 'is', null); // Only include workouts that have a completion date
    
    if (workoutsError) {
      console.error("Error fetching workout completions:", workoutsError);
    }
    
    console.log(`Found ${workoutCompletions?.length || 0} workout completions`);
    
    // Get run logs from workout completions with workout_type = 'running'
    console.log("Extracting run data from workout completions");
    const runLogs = (workoutCompletions || []).filter(
      wc => wc.workout_type === 'running' && wc.user_id === client_id
    );
    
    console.log(`Found ${runLogs?.length || 0} run logs from workout completions`);
    
    // Extract cardio logs from workout completions with workout_type = 'cardio'
    console.log("Extracting cardio data from workout completions");
    const cardioLogs = (workoutCompletions || []).filter(
      wc => wc.workout_type === 'cardio' && wc.user_id === client_id
    );
    
    console.log(`Found ${cardioLogs?.length || 0} cardio logs from workout completions`);
    
    // 8. Calculate actual progress metrics
    // Count completed strength workouts for this specific user
    const strengthWorkouts = (workoutCompletions || []).filter(
      wc => (wc.workout_type === 'strength' || wc.workout_type === 'bodyweight') && wc.user_id === client_id
    ).length;
    
    // Count completed mobility workouts for this specific user
    const mobilityWorkouts = (workoutCompletions || []).filter(
      wc => wc.workout_type === 'flexibility' && wc.user_id === client_id
    ).length;
    
    // Sum run distances - these are already filtered by client_id
    const milesRun = runLogs.reduce(
      (sum, log) => sum + (Number(log.distance) || 0), 
      0
    );
    
    // Sum cardio minutes from cardio logs - these are already filtered by client_id
    const cardioMinutesFromLogs = cardioLogs.reduce(
      (sum, log) => sum + (Number(log.duration) || 0), 
      0
    );
    
    // Get additional cardio minutes from running workouts - already filtered by client_id
    const cardioWorkoutsDetails = runLogs.map(wc => ({
      id: wc.id,
      type: wc.workout_type,
      duration: Number(wc.duration) || 0,
      distance: wc.distance,
      completed_at: wc.completed_at
    }));
      
    console.log("Cardio workouts contributing to the total:");
    console.log(JSON.stringify(cardioWorkoutsDetails, null, 2));
    
    // Calculate cardio minutes from running workouts using duration
    const cardioMinutesFromRunning = runLogs.reduce(
      (sum, log) => sum + (Number(log.duration) || 0), 
      0
    );
    
    // Total cardio minutes (now including run minutes)
    const cardioMinutes = cardioMinutesFromLogs + cardioMinutesFromRunning;
    
    console.log("Cardio minutes breakdown:");
    console.log("- From cardio logs:", cardioMinutesFromLogs);
    console.log("- From running logs:", cardioMinutesFromRunning);
    console.log("- Total:", cardioMinutes);
    
    // 9. Determine program type (default to strength if not specified)
    // We can check the workout types or other factors to determine this
    let programType = "moai_strength";
    
    // If program has significant run targets or run workouts, consider it a running program
    if (assignedWorkouts && assignedWorkouts.some(w => w.workout_type === 'running')) {
      programType = "moai_run";
    }
    
    console.log("Program type:", programType);
    
    // 10. Build the response object
    const response = {
      program_id: programAssignment.program_id,
      program_title: programAssignment.program?.title,
      current_week: currentWeekNumber,
      total_weeks: programAssignment.program?.weeks || 4,
      program_type: programType,
      metrics: {
        strength_workouts: { 
          target: strengthWorkoutsCount, 
          actual: strengthWorkouts 
        },
        strength_mobility: { 
          target: mobilityWorkoutsCount, 
          actual: mobilityWorkouts 
        },
        miles_run: { 
          target: targetMilesRun, 
          actual: milesRun 
        },
        cardio_minutes: { 
          target: targetCardioMinutes, 
          actual: cardioMinutes 
        }
      }
    };
    
    console.log("Response prepared:", JSON.stringify(response));
    
    // Return the response
    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in get_weekly_progress function:", error);
    
    // Return error response with default values
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        program_id: "",
        program_title: "Error",
        current_week: 1,
        total_weeks: 4,
        program_type: "moai_strength",
        metrics: {
          strength_workouts: { target: 0, actual: 0 },
          strength_mobility: { target: 0, actual: 0 },
          miles_run: { target: 0, actual: 0 },
          cardio_minutes: { target: 0, actual: 0 }
        }
      }),
      {
        status: 200, // Return 200 with error details instead of 500
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
