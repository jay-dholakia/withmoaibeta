
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

        // Insert into run_logs table
        const { data, error } = await supabaseClient
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

        if (error) {
          console.error("Error logging run activity:", error);
          throw error;
        }
        
        result = { 
          success: true, 
          message: "Run activity logged successfully", 
          id: data.id,
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

        // Insert into cardio_logs table
        const { data, error } = await supabaseClient
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

        if (error) {
          console.error("Error logging cardio activity:", error);
          throw error;
        }
        
        result = { 
          success: true, 
          message: "Cardio activity logged successfully", 
          id: data.id,
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

        // Insert into rest_logs table
        const { data, error } = await supabaseClient
          .from("rest_logs")
          .insert({
            client_id,
            log_date: new Date(date).toISOString(),
            notes,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Error logging rest activity:", error);
          throw error;
        }
        
        result = { 
          success: true, 
          message: "Rest day logged successfully", 
          id: data.id,
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
