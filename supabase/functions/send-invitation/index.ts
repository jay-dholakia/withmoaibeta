
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.37.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationPayload {
  email: string;
  userType: "client" | "coach" | "admin";
  siteUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Send invitation function started");
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Log environment variable availability (not the actual values)
    console.log("Environment check:", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasServiceRoleKey: !!supabaseServiceRoleKey
    });
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse the request body
    let payload: InvitationPayload;
    try {
      payload = await req.json();
      console.log("Request payload received:", { 
        email: payload.email, 
        userType: payload.userType,
        hasSiteUrl: !!payload.siteUrl
      });
    } catch (jsonError) {
      console.error("Failed to parse request body:", jsonError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, userType } = payload;

    if (!email || !userType) {
      console.error("Missing required fields:", { email, userType });
      return new Response(
        JSON.stringify({ error: "Email and userType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the JWT token to verify the user
    const authHeader = req.headers.get("Authorization");
    
    // If there's an auth header, verify the user is an admin
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      console.log("Auth token provided, verifying user");
      
      try {
        // Verify the JWT token and get the user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (userError || !user) {
          console.error("Invalid token or user not found:", userError);
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

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return new Response(
            JSON.stringify({ error: "Error fetching user profile" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!profile || profile.user_type !== "admin") {
          console.error("Unauthorized - user is not an admin:", profile?.user_type);
          return new Response(
            JSON.stringify({ error: "Unauthorized - Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log("User verified as admin");
      } catch (authError) {
        console.error("Error during authentication:", authError);
        return new Response(
          JSON.stringify({ error: "Authentication error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log("No authorization header provided - bypassing admin check in development");
      // In production, you might want to reject requests without auth headers
      // For development, we'll allow requests without auth headers to proceed
    }

    console.log("Creating invitation for:", { email, userType });

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
        JSON.stringify({ error: "Invitation created but could not fetch details", invitationId }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || payload.siteUrl || "";
    const inviteLink = `${siteUrl}/register?token=${invitation.token}&type=${userType}`;

    console.log("Invitation created successfully:", { invitationId, inviteLink });

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent to ${email}`,
        invitationId,
        token: invitation.token,
        expiresAt: invitation.expires_at,
        inviteLink
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
