
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") as string;
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") as string;
const REDIRECT_URL = `${SUPABASE_URL}/functions/v1/google-calendar-callback`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for auth header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verify the token and get the user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized", details: authError }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create Google OAuth URL
  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar"
  ];

  const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  oauthUrl.searchParams.append("client_id", CLIENT_ID);
  oauthUrl.searchParams.append("redirect_uri", REDIRECT_URL);
  oauthUrl.searchParams.append("response_type", "code");
  oauthUrl.searchParams.append("scope", scopes.join(" "));
  oauthUrl.searchParams.append("access_type", "offline");
  oauthUrl.searchParams.append("prompt", "consent");
  oauthUrl.searchParams.append("state", user.id);

  return new Response(JSON.stringify({ url: oauthUrl.toString() }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
