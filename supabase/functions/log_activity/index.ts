
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Configure CORS headers for the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle incoming requests
serve(async (req) => {
  console.log("Edge function triggered: log_activity");
  
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
    const body = await req.json();
    let { client_id, activity_type, activity_data } = body;
    
    console.log("Request body:", { client_id, activity_type, activity_data });

    // Ensure client_id is provided (either explicitly or from the JWT)
    client_id = client_id || user.id;

    // Validate required fields
    if (!activity_type || !activity_data) {
      console.error("Missing required fields");
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
      console.error("Invalid activity type:", activity_type);
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
    
    // Process based on activity type - each type results in a SINGLE workout completion
    switch (activity_type) {
      case "run": {
        // Validate run activity data
        const { date, distance, duration, location, notes, workout_type } = activity_data;
        console.log("Processing run activity:", { date, distance, duration, location, notes, workout_type });
        
        if (!date || !distance || !duration) {
          console.error("Missing required fields for run activity");
          return new Response(
            JSON.stringify({ error: "Missing required fields for run activity" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Insert into workout_completions table as a running workout
        const { data: workoutData, error: workoutError } = await supabaseClient
          .from("workout_completions")
          .insert({
            user_id: client_id,
            completed_at: new Date(date).toISOString(),
            title: `${distance} mile run`,
            workout_type: workout_type || "running", // Use provided workout_type or default to "running"
            notes,
            distance: distance.toString(),
            duration: duration.toString(),
            location
          })
          .select("id")
          .single();
        
        if (workoutError) {
          console.error("Error creating workout completion for run:", workoutError);
          throw workoutError;
        }
        
        workoutCompletionId = workoutData.id;
        console.log("Created workout completion for run:", workoutCompletionId);
        
        result = { 
          success: true, 
          message: "Run activity logged successfully", 
          id: workoutCompletionId,
          workout_completion_id: workoutCompletionId,
          activity_type: "run"
        };
        break;
      }

      case "cardio": {
        // Validate cardio activity data
        const { date, activity_type: type, duration, notes, workout_type } = activity_data;
        console.log("Processing cardio activity:", { date, type, duration, notes, workout_type });
        
        if (!date || !duration || !type) {
          console.error("Missing required fields for cardio activity");
          return new Response(
            JSON.stringify({ error: "Missing required fields for cardio activity" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Insert into workout_completions table as a cardio workout
        const { data: workoutData, error: workoutError } = await supabaseClient
          .from("workout_completions")
          .insert({
            user_id: client_id,
            completed_at: new Date(date).toISOString(),
            title: type,
            workout_type: workout_type || "cardio", // Use provided workout_type or default to "cardio"
            notes,
            duration: duration.toString()
          })
          .select("id")
          .single();
        
        if (workoutError) {
          console.error("Error creating workout completion for cardio:", workoutError);
          throw workoutError;
        }
        
        workoutCompletionId = workoutData.id;
        console.log("Created workout completion for cardio:", workoutCompletionId);
        
        result = { 
          success: true, 
          message: "Cardio activity logged successfully", 
          id: workoutCompletionId,
          workout_completion_id: workoutCompletionId,
          activity_type: "cardio"
        };
        break;
      }

      case "rest": {
        // Validate rest activity data
        const { date, notes, workout_type } = activity_data;
        console.log("Processing rest activity:", { date, notes, workout_type });
        
        if (!date) {
          console.error("Missing required fields for rest activity");
          return new Response(
            JSON.stringify({ error: "Missing required fields for rest activity" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Insert into workout_completions table as a rest day
        const { data: workoutData, error: workoutError } = await supabaseClient
          .from("workout_completions")
          .insert({
            user_id: client_id,
            completed_at: new Date(date).toISOString(),
            title: "Rest Day",
            workout_type: workout_type || "rest_day", // Use provided workout_type or default to "rest_day"
            rest_day: true,
            notes
          })
          .select("id")
          .single();
        
        if (workoutError) {
          console.error("Error creating workout completion for rest day:", workoutError);
          throw workoutError;
        }
        
        workoutCompletionId = workoutData.id;
        console.log("Created workout completion for rest day:", workoutCompletionId);
        
        result = { 
          success: true, 
          message: "Rest day logged successfully", 
          id: workoutCompletionId,
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
    console.log("Result:", result);
    
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
