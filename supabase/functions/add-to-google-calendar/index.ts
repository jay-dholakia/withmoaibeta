
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check for auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const requestData = await req.json();
    const { workoutId, title, description, dayOfWeek, startTime } = requestData;

    if (!workoutId || !title) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing calendar event request:", { 
      userId: user.id,
      workoutId,
      title,
      dayOfWeek: dayOfWeek || "not provided",
      startTime: startTime || "not provided"
    });

    // Get user's Google Calendar token
    const { data: tokenData, error: tokenError } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      console.error("Google Calendar token error:", tokenError);
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Found user token:", { 
      userId: user.id, 
      tokenExpiry: new Date(tokenData.expiry_date).toISOString(),
      isExpired: tokenData.expiry_date < Date.now()
    });

    // Check if token is expired
    if (tokenData.expiry_date < Date.now()) {
      console.log("Token expired, attempting to refresh");
      // Refresh token
      try {
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
            client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
            refresh_token: tokenData.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        const refreshData = await refreshResponse.json();
        
        if (refreshData.error) {
          console.error("Token refresh error:", refreshData);
          return new Response(JSON.stringify({ error: "Failed to refresh token", details: refreshData.error }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Token refreshed successfully");

        // Update token in database
        await supabase.from("google_calendar_tokens").update({
          access_token: refreshData.access_token,
          expiry_date: Date.now() + (refreshData.expires_in * 1000),
        }).eq("user_id", user.id);

        tokenData.access_token = refreshData.access_token;
      } catch (error) {
        console.error("Token refresh error:", error);
        return new Response(JSON.stringify({ error: "Failed to refresh token", details: error.message }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Determine event start and end time
    let eventStart, eventEnd;
    
    if (startTime) {
      // If a specific time is provided
      eventStart = new Date(startTime);
      eventEnd = new Date(eventStart);
      eventEnd.setHours(eventEnd.getHours() + 1); // Default to 1 hour
    } else {
      // Create an event based on day of week
      const today = new Date();
      const targetDay = dayOfWeek || today.getDay();
      const daysUntilTarget = (targetDay + 7 - today.getDay()) % 7;
      
      eventStart = new Date(today);
      eventStart.setDate(today.getDate() + daysUntilTarget);
      eventStart.setHours(10, 0, 0, 0); // Default to 10:00 AM
      
      eventEnd = new Date(eventStart);
      eventEnd.setHours(eventEnd.getHours() + 1); // Default to 1 hour
    }

    // Format dates for Google Calendar API
    const formattedStart = eventStart.toISOString();
    const formattedEnd = eventEnd.toISOString();

    // Create event
    const event = {
      summary: title,
      description: description || "A workout from your training plan",
      start: {
        dateTime: formattedStart,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: formattedEnd,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    console.log("Event to be created:", { 
      summary: event.summary,
      start: event.start.dateTime,
      end: event.end.dateTime,
      timeZone: event.start.timeZone
    });

    // Add to Google Calendar
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error("Google Calendar API error:", {
        status: calendarResponse.status,
        statusText: calendarResponse.statusText,
        response: errorText
      });
      
      try {
        // Try to parse the error as JSON
        const errorJson = JSON.parse(errorText);
        return new Response(JSON.stringify({ 
          error: "Failed to add event to calendar", 
          status: calendarResponse.status,
          details: errorJson 
        }), {
          status: calendarResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        // If parsing fails, return the raw text
        return new Response(JSON.stringify({ 
          error: "Failed to add event to calendar", 
          status: calendarResponse.status,
          details: errorText 
        }), {
          status: calendarResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    const calendarData = await calendarResponse.json();
    console.log("Event created successfully:", {
      id: calendarData.id,
      htmlLink: calendarData.htmlLink
    });

    // Store the calendar event in a table (optional enhancement)
    // This would allow you to track which workouts have been added to calendars
    // and potentially update or delete them later

    return new Response(JSON.stringify({ 
      success: true, 
      event: {
        id: calendarData.id,
        htmlLink: calendarData.htmlLink
      } 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Server error", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
