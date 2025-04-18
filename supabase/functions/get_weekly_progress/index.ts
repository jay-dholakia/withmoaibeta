
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import { startOfWeek, endOfWeek } from "https://esm.sh/date-fns@2.30.0";
import { formatInTimeZone } from "https://esm.sh/date-fns-tz@3.0.0";

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

    // 1. Get current date info in Pacific Time
    const today = new Date();
    // Convert to Pacific Time
    const todayPT = formatInTimeZone(today, "America/Los_Angeles", "yyyy-MM-dd");
    const todayDate = new Date(todayPT);
    
    // Calculate week boundaries in PT - ENSURE week starts on Monday (1) and ends on Sunday
    // Using startOfWeek with weekStartsOn: 1 (Monday)
    const weekStart = new Date(todayDate);
    const dayOfWeek = weekStart.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If today is Sunday, it's 6 days from Monday, otherwise dayOfWeek - 1
    weekStart.setDate(todayDate.getDate() - daysFromMonday); // Go back to the most recent Monday
    weekStart.setHours(0, 0, 0, 0); // Set to midnight (start of day)
    
    // End of week is Sunday night at 11:59:59 PM (or Monday at 00:00:00, which is the start of the next week)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7); // Add 7 days to get to next Monday at 12:00 AM
    
    // ISO format for database queries
    const weekStartISO = weekStart.toISOString();
    const weekEndISO = weekEnd.toISOString();
    console.log(`Week range (Pacific Time): ${weekStartISO} to ${weekEndISO}`);
    console.log(`Day of week: ${dayOfWeek}, Days from Monday: ${daysFromMonday}`);
    
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
          description,
          program_type
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
    
    // 3. Calculate which program week we're in (using Pacific Time)
    // Convert program start date to Pacific Time for consistent calculation
    const programStartDatePT = formatInTimeZone(new Date(programAssignment.start_date), "America/Los_Angeles", "yyyy-MM-dd");
    const programStartDate = new Date(programStartDatePT);
    
    // Calculate full weeks (Monday to Sunday) since program start
    // Align to Monday-based weeks
    const programStartDay = programStartDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysUntilFirstMonday = programStartDay === 0 ? 1 : (programStartDay === 1 ? 0 : 8 - programStartDay);
    
    // Adjust program start date to the first Monday (for week calculation purposes)
    const firstProgramMonday = new Date(programStartDate);
    firstProgramMonday.setDate(programStartDate.getDate() + daysUntilFirstMonday);
    firstProgramMonday.setHours(0, 0, 0, 0); // Start of day
    
    console.log(`Program start: ${programStartDate.toISOString()}, First Monday: ${firstProgramMonday.toISOString()}`);
    
    // If the program hasn't reached its first Monday yet, we're in week 1
    let currentWeekNumber = 1;
    if (todayDate >= firstProgramMonday) {
      // Calculate full weeks since the first Monday
      const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeksSinceFirstMonday = Math.floor((todayDate.getTime() - firstProgramMonday.getTime()) / millisecondsPerWeek);
      currentWeekNumber = weeksSinceFirstMonday + 1; // +1 because we're in the first week even with 0 full weeks passed
    }
    
    // Ensure week number is within program bounds
    currentWeekNumber = Math.min(
      Math.max(1, currentWeekNumber), 
      programAssignment.program?.weeks || 4
    );
    
    console.log("Current week number (Pacific Time):", currentWeekNumber, "/ Total weeks:", programAssignment.program?.weeks || 4);
    console.log(`Today's date (PT): ${todayDate.toISOString()}`);

    // 4. Get workouts for the specific week from program_weeks and workouts tables
    console.log(`Fetching workouts for week ${currentWeekNumber} of program ${programAssignment.program_id}`);
    
    // First get the week ID for the current week number
    const { data: weekData, error: weekError } = await supabaseClient
      .from('workout_weeks')
      .select(`
        id, 
        target_miles_run, 
        target_cardio_minutes, 
        target_strength_workouts, 
        target_strength_mobility_workouts
      `)
      .eq('program_id', programAssignment.program_id)
      .eq('week_number', currentWeekNumber)
      .maybeSingle();
    
    if (weekError) {
      console.error(`Error fetching week ${currentWeekNumber}:`, weekError);
    }

    // Determine program type directly from the program record
    let programType = "moai_strength"; // Default
    
    if (programAssignment.program?.program_type === "run") {
      programType = "moai_run";
      console.log("Program type set to run based on program settings");
    }

    // Get target metrics from workout_weeks - ensure we use actual values
    let targetMilesRun = weekData?.target_miles_run || 0;
    let targetCardioMinutes = weekData?.target_cardio_minutes || 60;
    let targetStrengthWorkouts = weekData?.target_strength_workouts || 0;
    let targetMobilityWorkouts = weekData?.target_strength_mobility_workouts || 0;
    
    console.log("Program targets:", {
      targetMilesRun,
      targetCardioMinutes,
      targetStrengthWorkouts,
      targetMobilityWorkouts
    });
    
    // 5. Fetch completed workouts for the week (using the Pacific Time week boundaries)
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
      .lt('completed_at', weekEndISO)
      .not('completed_at', 'is', null); // Only include workouts that have a completion date
    
    if (workoutsError) {
      console.error("Error fetching workout completions:", workoutsError);
    }
    
    console.log(`Found ${workoutCompletions?.length || 0} workout completions for week (Pacific Time)`);
    
    // Count completed strength workouts for this specific user
    const strengthWorkouts = (workoutCompletions || []).filter(
      wc => (wc.workout_type === 'strength' || wc.workout_type === 'bodyweight') && wc.user_id === client_id
    ).length;
    
    // Count completed mobility workouts for this specific user
    const mobilityWorkouts = (workoutCompletions || []).filter(
      wc => wc.workout_type === 'flexibility' && wc.user_id === client_id
    ).length;
    
    // Sum run distances from workout completions with workout_type = 'running'
    const milesRun = (workoutCompletions || [])
      .filter(wc => wc.workout_type === 'running')
      .reduce((sum, wc) => {
        // Convert distance to number and add to sum, treat invalid values as 0
        const distance = Number(wc.distance) || 0;
        return sum + distance;
      }, 0);
    
    console.log("Total miles run this week:", milesRun);
    
    // Calculate cardio minutes from all cardio activities (running and cardio)
    const cardioMinutes = (workoutCompletions || [])
      .filter(wc => wc.workout_type === 'cardio' || wc.workout_type === 'running')
      .reduce((sum, wc) => {
        // Convert duration to number and add to sum, treat invalid values as 0
        const duration = Number(wc.duration) || 0;
        return sum + duration;
      }, 0);
    
    console.log("Total cardio minutes this week:", cardioMinutes);
    
    // If this is a running program but the miles target is missing, set a default
    if (programType === "moai_run" && targetMilesRun === 0) {
      targetMilesRun = 5; // Default value for running programs
      console.log("Setting default miles target of 5 for running program");
    }
    
    // 10. Build the response object
    const response = {
      program_id: programAssignment.program_id,
      program_title: programAssignment.program?.title,
      current_week: currentWeekNumber,
      total_weeks: programAssignment.program?.weeks || 4,
      program_type: programType,
      metrics: {
        strength_workouts: { 
          target: targetStrengthWorkouts, 
          actual: strengthWorkouts 
        },
        strength_mobility: { 
          target: targetMobilityWorkouts, 
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
