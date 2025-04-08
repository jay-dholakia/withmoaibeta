
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

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

    // Parse the request body
    let { client_id, activity_type, activity_data } = await req.json();

    // Ensure client_id is provided (either explicitly or from the JWT)
    client_id = client_id || user.id;

    // Validate required fields
    if (!activity_type || !activity_data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate activity type
    if (!["run", "cardio", "rest"].includes(activity_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid activity type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result;
    let workoutCompletionId;
    
    // Process based on activity type
    switch (activity_type) {
      case "run": {
        // Validate run activity data
        const { date, distance, duration, location, notes } = activity_data;
        if (!date || !distance || !duration) {
          return new Response(
            JSON.stringify({ error: "Missing required fields for run activity" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Step 1: Insert into run_logs table
        const { data: runData, error: runError } = await supabaseClient
          .from("run_logs")
          .insert({
            client_id,
            log_date: new Date(date).toISOString(),
            distance,
            duration,
            location,
            notes,
          })
          .select("id")
          .single();

        if (runError) {
          console.error("Error logging run activity:", runError);
          throw runError;
        }
        
        // Step 2: Insert into workout_completions table to track as a workout
        const { data: workoutData, error: workoutError } = await supabaseClient
          .from("workout_completions")
          .insert({
            user_id: client_id,
            completed_at: new Date(date).toISOString(),
            title: `${distance} mile run`,
            workout_type: "running",
            notes,
            distance: distance.toString(),
            duration: duration.toString(),
            location
          })
          .select("id")
          .single();
        
        if (workoutError) {
          console.error("Error creating workout completion for run:", workoutError);
          // Continue even if this fails - we still logged the run
        } else {
          workoutCompletionId = workoutData.id;
          console.log("Created workout completion for run:", workoutCompletionId);
        }
        
        result = { 
          success: true, 
          message: "Run activity logged successfully", 
          id: runData.id,
          workout_completion_id: workoutCompletionId,
          activity_type: "run"
        };
        break;
      }

      case "cardio": {
        // Validate cardio activity data
        const { date, type, duration, notes } = activity_data;
        if (!date || !duration || !type) {
          return new Response(
            JSON.stringify({ error: "Missing required fields for cardio activity" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Step 1: Insert into cardio_logs table
        const { data: cardioData, error: cardioError } = await supabaseClient
          .from("cardio_logs")
          .insert({
            client_id,
            log_date: new Date(date).toISOString(),
            activity_type: type,
            duration,
            notes,
          })
          .select("id")
          .single();

        if (cardioError) {
          console.error("Error logging cardio activity:", cardioError);
          throw cardioError;
        }
        
        // Step 2: Insert into workout_completions table to track as a workout
        const { data: workoutData, error: workoutError } = await supabaseClient
          .from("workout_completions")
          .insert({
            user_id: client_id,
            completed_at: new Date(date).toISOString(),
            title: `${type} (${duration} mins)`,
            workout_type: "cardio",
            notes,
            duration: duration.toString()
          })
          .select("id")
          .single();
        
        if (workoutError) {
          console.error("Error creating workout completion for cardio:", workoutError);
          // Continue even if this fails - we still logged the cardio
        } else {
          workoutCompletionId = workoutData.id;
          console.log("Created workout completion for cardio:", workoutCompletionId);
        }
        
        result = { 
          success: true, 
          message: "Cardio activity logged successfully", 
          id: cardioData.id,
          workout_completion_id: workoutCompletionId,
          activity_type: "cardio"
        };
        break;
      }

      case "rest": {
        // Validate rest activity data
        const { date, notes } = activity_data;
        if (!date) {
          return new Response(
            JSON.stringify({ error: "Missing required fields for rest activity" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Step 1: Insert into rest_logs table
        const { data: restData, error: restError } = await supabaseClient
          .from("rest_logs")
          .insert({
            client_id,
            log_date: new Date(date).toISOString(),
            notes,
          })
          .select("id")
          .single();

        if (restError) {
          console.error("Error logging rest activity:", restError);
          throw restError;
        }
        
        // Step 2: Insert into workout_completions table as a rest day
        const { data: workoutData, error: workoutError } = await supabaseClient
          .from("workout_completions")
          .insert({
            user_id: client_id,
            completed_at: new Date(date).toISOString(),
            title: "Rest Day",
            rest_day: true,
            notes
          })
          .select("id")
          .single();
        
        if (workoutError) {
          console.error("Error creating workout completion for rest day:", workoutError);
          // Continue even if this fails - we still logged the rest day
        } else {
          workoutCompletionId = workoutData.id;
          console.log("Created workout completion for rest day:", workoutCompletionId);
        }
        
        result = { 
          success: true, 
          message: "Rest day logged successfully", 
          id: restData.id,
          workout_completion_id: workoutCompletionId,
          activity_type: "rest"
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid activity type" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    console.log(`Successfully logged ${activity_type} activity for client ${client_id}`);
    
    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in log_activity function:", error);
    
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
