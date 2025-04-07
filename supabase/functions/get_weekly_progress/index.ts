
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(
        JSON.stringify({ error: "No authorization token provided" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request body to get client_id
    let { client_id } = await req.json();
    
    // Use authenticated user id if client_id not provided
    client_id = client_id || user.id;

    // 1. Get current date info
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    
    // ISO format for database queries
    const weekStartISO = weekStart.toISOString();
    const weekEndISO = weekEnd.toISOString();
    
    // 2. Get client's current active program
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
        JSON.stringify({ error: "Failed to fetch program assignment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (!programAssignment) {
      return new Response(
        JSON.stringify({ error: "No active program found for client" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // 3. Calculate which program week we're in
    const programStartDate = new Date(programAssignment.start_date);
    const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceStart = Math.floor((today.getTime() - programStartDate.getTime()) / millisecondsPerWeek) + 1;
    
    // Ensure week number is within program bounds
    const currentWeekNumber = Math.min(
      Math.max(1, weeksSinceStart), 
      programAssignment.program?.weeks || 4
    );
    
    // 4. Get the week's targets from program_weeks
    const { data: weekData, error: weekError } = await supabaseClient
      .from('workout_weeks')
      .select(`
        id,
        week_number,
        target_strength_workouts,
        target_strength_mobility_workouts,
        target_miles_run,
        target_cardio_minutes
      `)
      .eq('program_id', programAssignment.program_id)
      .eq('week_number', currentWeekNumber)
      .maybeSingle();
    
    if (weekError) {
      console.error("Error fetching week data:", weekError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch program week targets" }),
        {
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (!weekData) {
      return new Response(
        JSON.stringify({ error: `Week ${currentWeekNumber} not found in program` }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Determine program type (default to strength if not specified)
    let programType = "moai_strength";
    
    // If program has significant run targets, consider it a running program
    if (weekData.target_miles_run && weekData.target_miles_run > 5) {
      programType = "moai_run";
    }
    
    // 6. Fetch completed workouts for the week
    const { data: workoutCompletions, error: workoutsError } = await supabaseClient
      .from('workout_completions')
      .select(`
        id,
        user_id,
        workout_id,
        completed_at,
        workout_type
      `)
      .eq('user_id', client_id)
      .gte('completed_at', weekStartISO)
      .lte('completed_at', weekEndISO)
      .not('completed_at', 'is', null); // Only include workouts that have a completion date
    
    if (workoutsError) {
      console.error("Error fetching workout completions:", workoutsError);
    }
    
    // 7. Fetch run logs for the week
    const { data: runLogs, error: runLogsError } = await supabaseClient
      .from('run_logs')
      .select('id, distance, duration')
      .eq('client_id', client_id)
      .gte('log_date', weekStartISO)
      .lte('log_date', weekEndISO);
    
    if (runLogsError) {
      console.error("Error fetching run logs:", runLogsError);
    }
    
    // 8. Fetch cardio logs for the week
    const { data: cardioLogs, error: cardioLogsError } = await supabaseClient
      .from('cardio_logs')
      .select('id, duration')
      .eq('client_id', client_id)
      .gte('log_date', weekStartISO)
      .lte('log_date', weekEndISO);
    
    if (cardioLogsError) {
      console.error("Error fetching cardio logs:", cardioLogsError);
    }
    
    // 9. Calculate actual progress metrics
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
    
    // Sum cardio minutes
    const cardioMinutes = (cardioLogs || []).reduce(
      (sum, log) => sum + (Number(log.duration) || 0), 
      0
    );
    
    // 10. Build the response object
    const response = {
      program_id: programAssignment.program_id,
      program_title: programAssignment.program?.title,
      current_week: currentWeekNumber,
      total_weeks: programAssignment.program?.weeks || 4,
      program_type: programType,
      metrics: {
        strength_workouts: { 
          target: weekData.target_strength_workouts || 0, 
          actual: strengthWorkouts 
        },
        strength_mobility: { 
          target: weekData.target_strength_mobility_workouts || 0, 
          actual: mobilityWorkouts 
        },
        miles_run: { 
          target: weekData.target_miles_run || 0, 
          actual: milesRun 
        },
        cardio_minutes: { 
          target: weekData.target_cardio_minutes || 0, 
          actual: cardioMinutes 
        }
      }
    };
    
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
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
