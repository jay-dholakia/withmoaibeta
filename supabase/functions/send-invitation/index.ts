
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.37.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationPayload {
  email: string;
  userType: "client" | "coach" | "admin";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the JWT token from the authorization header
    const token = authHeader.replace("Bearer ", "");

    // Verify the JWT token and get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.user_type !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request payload
    const { email, userType }: InvitationPayload = await req.json();

    if (!email || !userType) {
      return new Response(
        JSON.stringify({ error: "Email and userType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the database function to create the invitation
    const { data: invitationId, error: invitationError } = await supabaseClient.rpc(
      "create_and_send_invitation",
      {
        p_email: email,
        p_user_type: userType,
      }
    );

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      return new Response(
        JSON.stringify({ error: invitationError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the invitation details to include the token in the response
    const { data: invitation, error: fetchError } = await supabaseClient
      .from("invitations")
      .select("token, expires_at")
      .eq("id", invitationId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching invitation:", fetchError);
      return new Response(
        JSON.stringify({ error: "Invitation created but could not fetch details" }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent to ${email}`,
        invitationId,
        token: invitation.token,
        expiresAt: invitation.expires_at,
        inviteLink: `${Deno.env.get("SITE_URL") || window.location.origin}/register?token=${invitation.token}&type=${userType}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
