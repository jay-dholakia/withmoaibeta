
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.37.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Define CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the structure of the invitation payload
interface InvitationPayload {
  email?: string;
  userType: string;
  siteUrl: string;
  resend?: boolean;
  invitationId?: string;
  isShareLink?: boolean;
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
    
    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
      hasResendApiKey: !!resendApiKey,
      resendKeyFirstChars: resendApiKey ? `${resendApiKey.substring(0, 5)}...` : 'not set'
    });
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing required Supabase environment variables");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Server configuration error: Missing Supabase credentials" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Initialize Resend client if API key is available
    let resend;
    if (resendApiKey) {
      try {
        console.log("Initializing Resend client");
        resend = new Resend(resendApiKey);
        console.log("Resend client initialized successfully");
      } catch (resendError) {
        console.error("Failed to initialize Resend client:", resendError);
      }
    } else {
      console.log("No Resend API key provided, email functionality disabled");
    }

    // Parse the request body
    let payload: InvitationPayload;
    try {
      // Get the request body as a string
      const requestText = await req.text();
      console.log("Request body length:", requestText.length);
      console.log("Request body content:", requestText.substring(0, 200)); // Log first 200 chars to avoid huge logs
      
      if (!requestText || requestText.trim() === '') {
        console.error("Empty request body received");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Empty request body. Please provide valid JSON data." 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Parse JSON
      payload = JSON.parse(requestText);
      console.log("Request payload parsed:", { 
        email: payload.email, 
        userType: payload.userType,
        hasSiteUrl: !!payload.siteUrl,
        resend: payload.resend,
        invitationId: payload.invitationId,
        isShareLink: payload.isShareLink
      });
    } catch (jsonError) {
      console.error("Failed to parse request body:", jsonError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body: " + String(jsonError) 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract fields from payload
    const { email, userType, resend: isResend, invitationId, siteUrl, isShareLink } = payload;

    // Regular email invitations require an email
    if (!isShareLink && !email) {
      console.error("Missing required email field for regular invitation");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email is required for regular invitations" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All invitations require a user type
    if (!userType) {
      console.error("Missing required userType field");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "userType is required" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
            JSON.stringify({ 
              success: false, 
              error: "Invalid token" 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
            JSON.stringify({ 
              success: false, 
              error: "Error fetching user profile" 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!profile || profile.user_type !== "admin") {
          console.error("Unauthorized - user is not an admin:", profile?.user_type);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Unauthorized - Admin access required" 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log("User verified as admin");
      } catch (authError) {
        console.error("Error during authentication:", authError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Authentication error" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log("No authorization header provided - bypassing admin check in development");
      // For development, create a default admin user ID
      userId = "00000000-0000-0000-0000-000000000000"; // Dummy UUID for development
    }

    if (!userId) {
      console.error("No user ID available for invitation");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Authentication required" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle invitation logic
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
          JSON.stringify({ 
            success: false, 
            error: "Invitation not found" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Update the existing invitation - set a new expiration date and token
      const newToken = crypto.randomUUID();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30); // 30 days from now
      
      const { data: updatedInvitation, error: updateError } = await supabaseClient
        .from("invitations")
        .update({
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          created_at: new Date().toISOString(), // Update the created_at time as well
          accepted: false,
          accepted_at: null
        })
        .eq("id", invitationId)
        .select()
        .single();
        
      if (updateError) {
        console.error("Error updating invitation:", updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: updateError.message 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      invitation = updatedInvitation;
      console.log("Invitation updated successfully");
    } else {
      console.log("Creating new invitation for:", { email, userType, isShareLink, createdBy: userId });

      // Generate token and expiration date
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      // Insert the invitation
      const { data: newInvitation, error: invitationError } = await supabaseClient
        .from("invitations")
        .insert({
          email: isShareLink ? null : email,
          user_type: userType,
          invited_by: userId,
          token,
          expires_at: expiresAt.toISOString(),
          accepted: false,
          is_share_link: isShareLink || false,
          share_link_type: isShareLink ? userType : null
        })
        .select()
        .single();

      if (invitationError) {
        console.error("Error creating invitation:", invitationError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: invitationError.message 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      invitation = newInvitation;
      console.log("Invitation created successfully:", invitation);
    }

    // Generate the invitation link
    const inviteLink = `${siteUrl}/register?token=${invitation.token}&type=${userType}`;
    console.log("Generated invite link:", inviteLink);

    // For shareable links, we don't send emails
    if (invitation.is_share_link) {
      console.log("Returning shareable link response");
      return new Response(
        JSON.stringify({
          success: true,
          emailSent: false, // No email for shareable links
          message: `Shareable invitation link created for ${userType} account`,
          invitationId: invitation.id,
          token: invitation.token,
          expiresAt: invitation.expires_at,
          inviteLink
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only try to send email if we have Resend client and this is a regular invitation
    if (resend && email && !invitation.is_share_link) {
      try {
        console.log("Preparing to send email to:", email);
        
        // Capitalize the user type for better readability in the email
        const userTypeCapitalized = userType.charAt(0).toUpperCase() + userType.slice(1);
        
        // Send the email
        const emailResponse = await resend.emails.send({
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
              <p>This invitation will expire in 30 days.</p>
              <p>If you did not expect this invitation, you can safely ignore this email.</p>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                <p>© Moai. All rights reserved.</p>
              </div>
            </div>
          `
        });
        
        console.log("Email sent successfully:", JSON.stringify(emailResponse));
        
        // Return success with the invitation details
        return new Response(
          JSON.stringify({
            success: true,
            emailSent: true,
            message: isResend ? `Invitation resent to ${email}` : `Invitation sent to ${email}`,
            invitationId: invitation.id,
            token: invitation.token,
            expiresAt: invitation.expires_at,
            inviteLink,
            emailData: emailResponse
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (emailSendError) {
        console.error("Exception sending email with Resend:", emailSendError);
        
        // Return a 200 status with info about the invitation, but include error details
        return new Response(
          JSON.stringify({ 
            success: true, // We succeeded in creating the invitation
            emailSent: false,
            emailError: emailSendError.message || "Unknown email sending error",
            invitationId: invitation.id,
            token: invitation.token,
            expiresAt: invitation.expires_at,
            inviteLink
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // No Resend client or this is a shareable link
      return new Response(
        JSON.stringify({
          success: true,
          emailSent: false,
          emailError: "Email service not available",
          invitationId: invitation.id,
          token: invitation.token,
          expiresAt: invitation.expires_at,
          inviteLink
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An unexpected error occurred"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
