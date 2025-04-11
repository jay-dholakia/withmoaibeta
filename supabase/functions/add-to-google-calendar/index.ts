
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0';

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "";
const DENO_ENV = Deno.env.get("DENO_ENV") || "development";

// Create a supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The redirect URI for the OAuth flow to return to
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar-callback`;

// The base URL for the Google Calendar API
const GOOGLE_API_URL = "https://www.googleapis.com/calendar/v3";
// The base URL for Google OAuth
const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
// The token endpoint for Google OAuth
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Define the scopes we need for Google Calendar
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

serve(async (req) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS request (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }

  try {
    // Check for valid request
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        headers, 
        status: 405 
      });
    }

    // Parse request body
    const { workoutId, title, description, start, end, userId } = await req.json();

    if (!workoutId || !title || !start || !end || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { 
        headers, 
        status: 400 
      });
    }
    
    // Check for existing token
    const { data: tokenData, error: tokenError } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    // If we have a token, check if it's valid or refresh it
    if (tokenData && tokenData.access_token) {
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (tokenData.expires_at && tokenData.expires_at < now) {
        // Token is expired, try to refresh
        if (tokenData.refresh_token) {
          const refreshedToken = await refreshAccessToken(tokenData.refresh_token);
          
          if (refreshedToken) {
            // Update token in database
            await supabase
              .from("google_calendar_tokens")
              .update({
                access_token: refreshedToken.access_token,
                refresh_token: refreshedToken.refresh_token || tokenData.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + refreshedToken.expires_in,
              })
              .eq("user_id", userId);
              
            // Create event with new token
            const calendarEvent = await createCalendarEvent(
              refreshedToken.access_token,
              {
                title,
                description,
                start,
                end,
              }
            );
            
            if (calendarEvent) {
              // Update workout with calendar event ID
              await supabase
                .from("workout_completions")
                .update({
                  google_calendar_event_id: calendarEvent.id,
                })
                .eq("id", workoutId);
              
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  message: "Event added to Google Calendar",
                  eventId: calendarEvent.id
                }), 
                { headers }
              );
            }
          }
        }
      } else {
        // Token is still valid, create event
        const calendarEvent = await createCalendarEvent(
          tokenData.access_token,
          {
            title,
            description,
            start,
            end,
          }
        );
        
        if (calendarEvent) {
          // Update workout with calendar event ID
          await supabase
            .from("workout_completions")
            .update({
              google_calendar_event_id: calendarEvent.id,
            })
            .eq("id", workoutId);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Event added to Google Calendar",
              eventId: calendarEvent.id
            }), 
            { headers }
          );
        }
      }
    }

    // No valid token, need to start OAuth flow
    // Store workout info in a temporary table to retrieve after OAuth
    const { data: tempData, error: tempError } = await supabase
      .from("google_calendar_pending")
      .insert({
        user_id: userId,
        workout_id: workoutId,
        title,
        description,
        start_time: start,
        end_time: end,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tempError) {
      console.error("Error storing temp data:", tempError);
      return new Response(JSON.stringify({ error: "Failed to initiate OAuth flow" }), { 
        headers, 
        status: 500 
      });
    }

    // Generate state parameter to prevent CSRF
    const state = crypto.randomUUID();
    
    // Store state for validation during callback
    await supabase
      .from("google_oauth_states")
      .insert({
        user_id: userId,
        state,
        pending_id: tempData.id,
        created_at: new Date().toISOString(),
      });

    // Build authorization URL
    const authUrl = `${GOOGLE_OAUTH_URL}?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(SCOPES.join(" "))}` +
      `&access_type=offline` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=consent`;

    // Return the authorization URL for the frontend to redirect to
    return new Response(JSON.stringify({ authUrl }), { headers });
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { 
      headers, 
      status: 500 
    });
  }
});

// Function to refresh an access token
async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Token refresh error:", data.error);
      return null;
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token, // May not be returned
      expires_in: data.expires_in,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

// Function to create a calendar event using the Google Calendar API
async function createCalendarEvent(accessToken: string, eventDetails: any) {
  try {
    const { title, description, start, end } = eventDetails;
    
    const event = {
      summary: title,
      description,
      start: {
        dateTime: start,
        timeZone: "UTC",
      },
      end: {
        dateTime: end,
        timeZone: "UTC",
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await fetch(`${GOOGLE_API_URL}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Calendar API error:", errorData);
      
      // If unauthorized, token might be expired despite our check
      if (response.status === 401) {
        return null;
      }
      
      throw new Error("Failed to create calendar event");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}
