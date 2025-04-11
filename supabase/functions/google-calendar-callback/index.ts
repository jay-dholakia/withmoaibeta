
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") as string;
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") as string;
const REDIRECT_URL = `${SUPABASE_URL}/functions/v1/google-calendar-callback`;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // This contains the user ID
  const error = url.searchParams.get("error");

  if (error) {
    return redirectWithError(`Google authentication error: ${error}`);
  }

  if (!code || !state) {
    return redirectWithError("Missing required parameters");
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData);
      return redirectWithError(`Failed to exchange token: ${tokenData.error}`);
    }

    // Store tokens in Supabase
    const { error: storageError } = await supabase.from("google_calendar_tokens").upsert(
      {
        user_id: state,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: Date.now() + (tokenData.expires_in * 1000),
      },
      { onConflict: "user_id" }
    );

    if (storageError) {
      console.error("Storage error:", storageError);
      return redirectWithError("Failed to save authentication data");
    }

    // Redirect back to frontend with success
    return Response.redirect(`${FRONTEND_URL}/client-dashboard/workouts?calendar=connected`, 302);
  } catch (error) {
    console.error("Callback error:", error);
    return redirectWithError("Authentication failed");
  }

  function redirectWithError(message: string) {
    return Response.redirect(`${FRONTEND_URL}/client-dashboard/workouts?error=${encodeURIComponent(message)}`, 302);
  }
});
