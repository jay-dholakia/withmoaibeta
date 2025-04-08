
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
    
    // Use defaults if we couldn't find workouts
    const defaultMilesRunTarget = 0;
    const defaultCardioMinutesTarget = 60;
    
    // 5. Fetch completed workouts for the week (unchanged)
    console.log("Fetching workout completions");
    const { data: workoutCompletions, error: workoutsError } = await supabaseClient
      .from('workout_completions')
      .select(`
        id,
        user_id,
        workout_id,
        completed_at,
        workout_type,
        duration
      `)
      .eq('user_id', client_id)
      .gte('completed_at', weekStartISO)
      .lte('completed_at', weekEndISO)
      .not('completed_at', 'is', null); // Only include workouts that have a completion date
    
    if (workoutsError) {
      console.error("Error fetching workout completions:", workoutsError);
    }
    
    console.log(`Found ${workoutCompletions?.length || 0} workout completions`);
    
    // 6. Fetch run logs for the week (unchanged)
    console.log("Fetching run logs");
    const { data: runLogs, error: runLogsError } = await supabaseClient
      .from('run_logs')
      .select('id, distance, duration')
      .eq('client_id', client_id)
      .gte('log_date', weekStartISO)
      .lte('log_date', weekEndISO);
    
    if (runLogsError) {
      console.error("Error fetching run logs:", runLogsError);
    }
    
    console.log(`Found ${runLogs?.length || 0} run logs`);
    
    // 7. Fetch cardio logs for the week (unchanged)
    console.log("Fetching cardio logs");
    const { data: cardioLogs, error: cardioLogsError } = await supabaseClient
      .from('cardio_logs')
      .select('id, duration')
      .eq('client_id', client_id)
      .gte('log_date', weekStartISO)
      .lte('log_date', weekEndISO);
    
    if (cardioLogsError) {
      console.error("Error fetching cardio logs:", cardioLogsError);
    }
    
    console.log(`Found ${cardioLogs?.length || 0} cardio logs`);
    
    // 8. Calculate actual progress metrics
    // Count completed strength workouts
    const strengthWorkouts = (workoutCompletions || []).filter(
      wc => wc.workout_type === 'strength' || wc.workout_type === 'bodyweight'
    ).length;
    
    // Count completed mobility workouts
    const mobilityWorkouts = (workoutCompletions || []).filter(
      wc => wc.workout_type === 'flexibility'
    ).length;
    
    // Sum run distances
    const milesRun = (runLogs || []).reduce(
      (sum, log) => sum + (Number(log.distance) || 0), 
      0
    );
    
    // Sum cardio minutes from both cardio logs and workout completions with duration
    const cardioMinutesFromLogs = (cardioLogs || []).reduce(
      (sum, log) => sum + (Number(log.duration) || 0), 
      0
    );
    
    // Get additional cardio minutes from relevant workout completions (for Moai Strength only)
    const cardioMinutesFromWorkouts = (workoutCompletions || [])
      .filter(wc => wc.workout_type === 'cardio' || wc.workout_type === 'running')
      .reduce((sum, wc) => sum + (Number(wc.duration) || 0), 0);
    
    // Total cardio minutes
    const cardioMinutes = cardioMinutesFromLogs + cardioMinutesFromWorkouts;
    
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
          target: defaultMilesRunTarget, 
          actual: milesRun 
        },
        cardio_minutes: { 
          target: defaultCardioMinutesTarget, 
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
