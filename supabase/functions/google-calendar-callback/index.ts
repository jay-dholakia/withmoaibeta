
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.14.0';

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "";

// Create a supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The redirect URI that we registered with Google
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar-callback`;
// The token endpoint for Google OAuth
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
// The base URL for the Google Calendar API
const GOOGLE_API_URL = "https://www.googleapis.com/calendar/v3";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    // Redirect with error message
    return Response.redirect(`${APP_URL}/client-dashboard/workouts?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return Response.redirect(`${APP_URL}/client-dashboard/workouts?error=missing_params`);
  }

  try {
    // Validate state to prevent CSRF
    const { data: stateData, error: stateError } = await supabase
      .from("google_oauth_states")
      .select("*")
      .eq("state", state)
      .single();

    if (stateError || !stateData) {
      console.error("Invalid state:", stateError);
      return Response.redirect(`${APP_URL}/client-dashboard/workouts?error=invalid_state`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error);
      return Response.redirect(`${APP_URL}/client-dashboard/workouts?error=token_exchange`);
    }

    // Store the tokens in the database
    const { error: tokenInsertError } = await supabase
      .from("google_calendar_tokens")
      .upsert({
        user_id: stateData.user_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      });

    if (tokenInsertError) {
      console.error("Token storage error:", tokenInsertError);
      return Response.redirect(`${APP_URL}/client-dashboard/workouts?error=token_storage`);
    }

    // Get the pending calendar event
    const { data: pendingData, error: pendingError } = await supabase
      .from("google_calendar_pending")
      .select("*")
      .eq("id", stateData.pending_id)
      .single();

    if (pendingError || !pendingData) {
      console.error("Pending event not found:", pendingError);
      return Response.redirect(`${APP_URL}/client-dashboard/workouts?error=pending_not_found`);
    }

    // Create the event in Google Calendar
    const eventResponse = await fetch(`${GOOGLE_API_URL}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: pendingData.title,
        description: pendingData.description,
        start: {
          dateTime: pendingData.start_time,
          timeZone: "UTC",
        },
        end: {
          dateTime: pendingData.end_time,
          timeZone: "UTC",
        },
        reminders: {
          useDefault: true,
        },
      }),
    });

    const eventData = await eventResponse.json();

    if (eventData.error) {
      console.error("Calendar API error:", eventData.error);
      return Response.redirect(`${APP_URL}/client-dashboard/workouts?error=calendar_api`);
    }

    // Update the workout with the calendar event ID
    await supabase
      .from("workout_completions")
      .update({
        google_calendar_event_id: eventData.id,
      })
      .eq("id", pendingData.workout_id);

    // Clean up the temporary data
    await supabase
      .from("google_calendar_pending")
      .delete()
      .eq("id", pendingData.id);

    await supabase
      .from("google_oauth_states")
      .delete()
      .eq("id", stateData.id);

    // Redirect back to the workout page with success message
    return Response.redirect(`${APP_URL}/client-dashboard/workouts?success=calendar_event_created`);
  } catch (error) {
    console.error("Error in callback:", error);
    return Response.redirect(`${APP_URL}/client-dashboard/workouts?error=server_error`);
  }
});
