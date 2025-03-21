
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.37.0";
import { Resend } from "https://esm.sh/resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationPayload {
  email: string;
  userType: "client" | "coach" | "admin";
  siteUrl?: string;
  resend?: boolean;
  invitationId?: string;
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL");
    
    // Comprehensive logging to diagnose environment variable issues
    console.log("Environment check:", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasServiceRoleKey: !!supabaseServiceRoleKey,
      hasResendApiKey: !!resendApiKey,
      hasSiteUrl: !!siteUrl,
      resendApiKeyPrefix: resendApiKey ? resendApiKey.substring(0, 5) + "..." : "missing",
      siteUrlValue: siteUrl || "Not set"
    });
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing required Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      console.error("Missing Resend API key, unable to send emails");
      return new Response(
        JSON.stringify({ 
          error: "Email service not configured: Missing Resend API key", 
          details: "The RESEND_API_KEY environment variable is not set or not accessible by the Edge Function.",
          environment: {
            resendKeySet: !!Deno.env.get("RESEND_API_KEY"),
            allEnvKeys: Object.keys(Deno.env.toObject())
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Initialize Resend
    const resend = new Resend(resendApiKey);
    
    // Validate Resend instance initialization
    if (!resend || typeof resend.emails?.send !== 'function') {
      console.error("Resend client invalid or not properly initialized");
      return new Response(
        JSON.stringify({ 
          error: "Email service initialization failed", 
          details: "Could not initialize the Resend client with the provided API key."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    let payload: InvitationPayload;
    try {
      payload = await req.json();
      console.log("Request payload received:", { 
        email: payload.email, 
        userType: payload.userType,
        hasSiteUrl: !!payload.siteUrl,
        resend: payload.resend,
        invitationId: payload.invitationId
      });
    } catch (jsonError) {
      console.error("Failed to parse request body:", jsonError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, userType, resend: isResend, invitationId } = payload;

    if (!email || !userType) {
      console.error("Missing required fields:", { email, userType });
      return new Response(
        JSON.stringify({ error: "Email and userType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the JWT token to verify the user
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
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

        userId = user.id;
        
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
      // For development, we'll create a default admin user ID
      // This is a workaround for the invited_by not-null constraint
      userId = "00000000-0000-0000-0000-000000000000"; // Dummy UUID for development
    }

    if (!userId) {
      console.error("No user ID available for invitation");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let invitation;
    
    if (isResend && invitationId) {
      console.log("Resending invitation:", invitationId);
      
      // Get the existing invitation
      const { data: existingInvitation, error: getInvitationError } = await supabaseClient
        .from("invitations")
        .select("*")
        .eq("id", invitationId)
        .single();
        
      if (getInvitationError || !existingInvitation) {
        console.error("Error fetching invitation:", getInvitationError);
        return new Response(
          JSON.stringify({ error: "Invitation not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Update the existing invitation - set a new expiration date and token
      const newToken = crypto.randomUUID();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now
      
      const { data: updatedInvitation, error: updateError } = await supabaseClient
        .from("invitations")
        .update({
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          created_at: new Date().toISOString(), // Update the created_at time as well
        })
        .eq("id", invitationId)
        .select()
        .single();
        
      if (updateError) {
        console.error("Error updating invitation:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      invitation = updatedInvitation;
      console.log("Invitation updated successfully:", { 
        invitationId: invitation.id, 
        token: invitation.token,
        expiresAt: invitation.expires_at
      });
    } else {
      console.log("Creating new invitation for:", { email, userType, createdBy: userId });

      // Generate token and expiration date
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // Insert the invitation directly instead of using the database function
      const { data: newInvitation, error: invitationError } = await supabaseClient
        .from("invitations")
        .insert({
          email,
          user_type: userType,
          invited_by: userId,
          token,
          expires_at: expiresAt.toISOString(),
          accepted: false
        })
        .select()
        .single();

      if (invitationError) {
        console.error("Error creating invitation:", invitationError);
        return new Response(
          JSON.stringify({ error: invitationError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      invitation = newInvitation;
      console.log("Invitation created successfully:", { 
        invitationId: invitation.id, 
        token: invitation.token,
        expiresAt: invitation.expires_at
      });
    }

    // Determine site URL from environment or payload
    const effectiveSiteUrl = siteUrl || payload.siteUrl || "";
    if (!effectiveSiteUrl) {
      console.warn("No site URL provided for invitation link");
    }
    
    const inviteLink = `${effectiveSiteUrl}/register?token=${invitation.token}&type=${userType}`;
    console.log("Generated invite link:", inviteLink);

    // Send the invitation email using Resend
    try {
      console.log("Sending email to:", email, "using Resend API");
      console.log("Using Resend API key starting with:", resendApiKey.substring(0, 5) + "...");
      
      // Additional Resend validation
      if (!resend || typeof resend.emails?.send !== 'function') {
        console.error("Resend instance is invalid:", typeof resend);
        throw new Error("Failed to initialize Resend client properly");
      }
      
      // Capitalize the user type for better readability in the email
      const userTypeCapitalized = userType.charAt(0).toUpperCase() + userType.slice(1);
      
      // Test Resend with a basic send operation
      console.log("Attempting to send email via Resend...");
      
      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: "Moai <jay@withmoai.co>",
        to: [email],
        subject: `You've been invited to join Moai as a ${userTypeCapitalized}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; margin-bottom: 20px;">Moai Invitation</h1>
            <p>You've been invited to join Moai as a ${userTypeCapitalized}.</p>
            <p>Click the button below to create your account:</p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #0066cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 14px; color: #666;">${inviteLink}</p>
            <p>This invitation will expire in 7 days.</p>
            <p>If you did not expect this invitation, you can safely ignore this email.</p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
              <p>© Moai. All rights reserved.</p>
            </div>
          </div>
        `
      });
      
      if (emailError) {
        console.error("Error sending email with Resend:", emailError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to send email", 
            details: emailError.message,
            invitation: {
              id: invitation.id,
              token: invitation.token,
              expiresAt: invitation.expires_at,
              inviteLink
            }
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.log("Email sent successfully via Resend:", emailResult);
      }
    } catch (emailSendError) {
      console.error("Exception sending email with Resend:", emailSendError);
      return new Response(
        JSON.stringify({ 
          error: "Exception sending email", 
          details: emailSendError.message,
          invitation: {
            id: invitation.id,
            token: invitation.token,
            expiresAt: invitation.expires_at,
            inviteLink
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: isResend ? `Invitation resent to ${email}` : `Invitation sent to ${email}`,
        invitationId: invitation.id,
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
