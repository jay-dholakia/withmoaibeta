
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Configure CORS headers for the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateWeeklyMetricsPayload {
  program_id: string;
  week_number: number;
  metrics: {
    target_strength_workouts?: number;
    target_strength_mobility_workouts?: number;
    target_miles_run?: number;
    target_cardio_minutes?: number;
  };
}

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

    // Parse the payload
    const payload: UpdateWeeklyMetricsPayload = await req.json();
    
    // Validate required fields
    if (!payload.program_id || !payload.week_number || !payload.metrics) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: program_id, week_number, or metrics" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the user is a coach
    const { data: coachProfile, error: coachError } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle();
    
    if (coachError || !coachProfile || coachProfile.user_type !== 'coach') {
      return new Response(
        JSON.stringify({ error: "Only coaches can update program metrics" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the coach has permission to edit this program
    const { data: program, error: programError } = await supabaseClient
      .from('workout_programs')
      .select('id, coach_id')
      .eq('id', payload.program_id)
      .maybeSingle();
    
    if (programError || !program) {
      return new Response(
        JSON.stringify({ error: "Program not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (program.coach_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to edit this program" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the program week exists
    const { data: existingWeek, error: weekError } = await supabaseClient
      .from('program_weeks')
      .select('id')
      .eq('program_id', payload.program_id)
      .eq('week_number', payload.week_number)
      .maybeSingle();
    
    let result;
    
    if (existingWeek) {
      // Update the existing week
      const { data, error } = await supabaseClient
        .from('program_weeks')
        .update({
          target_strength_workouts: payload.metrics.target_strength_workouts,
          target_strength_mobility_workouts: payload.metrics.target_strength_mobility_workouts,
          target_miles_run: payload.metrics.target_miles_run,
          target_cardio_minutes: payload.metrics.target_cardio_minutes,
        })
        .eq('id', existingWeek.id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating program week:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update program week" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      result = data;
    } else {
      // Create a new program week
      const { data, error } = await supabaseClient
        .from('program_weeks')
        .insert({
          program_id: payload.program_id,
          week_number: payload.week_number,
          target_strength_workouts: payload.metrics.target_strength_workouts,
          target_strength_mobility_workouts: payload.metrics.target_strength_mobility_workouts,
          target_miles_run: payload.metrics.target_miles_run,
          target_cardio_minutes: payload.metrics.target_cardio_minutes,
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating program week:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create program week" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      result = data;
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: existingWeek ? "Program week updated" : "Program week created",
        data: result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in update_weekly_metrics function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
