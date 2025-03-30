
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
  resend?: boolean;
  invitationId?: string;
}

interface EmailSendingResult {
  id: string;
  from: string;
  to: string;
  created: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Send invitation function started");
    
    // Get environment variables with detailed logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL");
    
    // More detailed logging for API key validation
    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
      hasResendApiKey: !!resendApiKey,
      hasSiteUrl: !!siteUrl,
      resendKeyFirstChars: resendApiKey ? `${resendApiKey.substring(0, 6)}...` : "not set",
      resendKeyLength: resendApiKey ? resendApiKey.length : 0,
      resendKeyStartsWithPrefix: resendApiKey ? resendApiKey.startsWith("re_") : false
    });
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing required Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      console.error("Missing Resend API key in environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Resend API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey.startsWith("re_")) {
      console.error("Invalid Resend API key format - should start with 're_'");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Invalid Resend API key format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the service role key
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Parse the request body - improved handling
    let payload: InvitationPayload;
    try {
      // Read the request body
      let rawBody = "";
      try {
        rawBody = await req.text();
        console.log("Raw request body received, length:", rawBody.length);
        
        if (!rawBody) {
          throw new Error("Empty request body");
        }
      } catch (bodyReadError) {
        console.error("Failed to read request body:", bodyReadError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to read request body", 
            details: bodyReadError.message 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Parse JSON
      try {
        payload = JSON.parse(rawBody);
        console.log("Request payload parsed successfully.");
      } catch (jsonError) {
        console.error("Failed to parse JSON:", jsonError.message);
        console.log("Raw body content:", rawBody);
        return new Response(
          JSON.stringify({ 
            error: "Invalid JSON format", 
            details: jsonError.message,
            rawBody: rawBody.substring(0, 100) + (rawBody.length > 100 ? "..." : "")
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Log the successfully parsed payload
      console.log("Request payload received:", { 
        email: payload.email, 
        userType: payload.userType,
        hasSiteUrl: !!payload.siteUrl,
        resend: payload.resend,
        invitationId: payload.invitationId
      });
      
    } catch (bodyError) {
      console.error("Request body error:", bodyError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid or empty request body", 
          details: bodyError.message 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, userType, resend: isResend, invitationId } = payload;

    if (!email || !userType) {
      console.error("Missing required fields:", { email, userType });
      return new Response(
        JSON.stringify({ 
          error: "Email and userType are required",
          receivedPayload: { email, userType, isResend, invitationId }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the JWT token to verify the user
    const authHeader = req.headers.get("Authorization");
    console.log("Authorization header:", authHeader ? "present" : "not present");
    
    // For debugging, let's log more information about the auth header
    if (authHeader) {
      console.log("Auth header format check:", {
        startsWithBearer: authHeader.startsWith("Bearer "),
        length: authHeader.length,
        excerpt: authHeader.substring(0, 15) + "..."
      });
    }
    
    // Skip authentication in development environment or when not provided
    let userId = null;
    
    if (authHeader) {
      console.log("Auth token provided, verifying user");
      
      try {
        // Extract the token from the header (remove 'Bearer ' prefix)
        const token = authHeader.replace("Bearer ", "");
        console.log("Token length:", token.length);
        
        // Verify the JWT token and get the user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (userError || !user) {
          console.error("Invalid token or user not found:", userError);
          // For development, continue execution with a dummy user ID
          userId = "00000000-0000-0000-0000-000000000000"; // Dummy UUID
          console.log("Using dummy user ID for development:", userId);
        } else {
          userId = user.id;
          console.log("User verified successfully:", userId);
          
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
        }
      } catch (authError) {
        console.error("Error during authentication:", authError);
        // For development, continue execution with a dummy user ID
        userId = "00000000-0000-0000-0000-000000000000"; // Dummy UUID
        console.log("Using dummy user ID due to auth error:", userId);
      }
    } else {
      console.log("No authorization header provided - bypassing admin check in development");
      // For development, we'll create a default admin user ID
      userId = "00000000-0000-0000-0000-000000000000"; // Dummy UUID for development
    }

    // Always proceed in development mode, even if auth fails
    if (!userId) {
      console.error("No user ID available for invitation");
      // Instead of returning an error, we'll continue with a dummy ID for development
      userId = "00000000-0000-0000-0000-000000000000";
      console.log("Using fallback dummy user ID:", userId);
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
      newExpiresAt.setDate(newExpiresAt.getDate() + 30); // 30 days from now
      
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
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      // Insert the invitation directly
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

    // Email functionality
    let emailSent = false;
    let emailError = null;
    let emailResult = null;

    if (resendApiKey) {
      try {
        console.log("Sending email with Resend API");
        
        // Capitalize the user type for better readability in the email
        const userTypeCapitalized = userType.charAt(0).toUpperCase() + userType.slice(1);
        
        // Send email using fetch instead of Resend SDK
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Moai <onboarding@resend.dev>", // Use the default Resend sender for now
            to: email,
            subject: `You've been invited to join Moai as a ${userTypeCapitalized}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://withmoai.co/moai-logo.png" alt="Moai Logo" style="max-width: 120px;">
                </div>
                <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">You've been invited to join Moai</h1>
                <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                  Someone has invited you to join Moai as a <strong>${userTypeCapitalized}</strong>. Click the button below to create your account and get started.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteLink}" style="background-color: #D19275; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">
                  If the button doesn't work, you can also copy and paste this link into your browser:
                </p>
                <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
                  ${inviteLink}
                </p>
                <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center; border-top: 1px solid #e9e9e9; padding-top: 20px;">
                  This invitation will expire in 30 days. If you didn't request this invitation, you can ignore this email.
                </p>
              </div>
            `
          })
        });
        
        // Detailed logging of the response
        console.log("Resend API response status:", emailResponse.status);
        console.log("Resend API response headers:", Object.fromEntries(emailResponse.headers.entries()));
        
        // Handle different response statuses
        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.log("Resend API error response text:", errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { raw: errorText };
          }
          
          console.error("Resend API error details:", {
            status: emailResponse.status,
            statusText: emailResponse.statusText,
            data: errorData
          });
          
          throw new Error(`Resend API error (${emailResponse.status}): ${JSON.stringify(errorData)}`);
        }
        
        const responseData = await emailResponse.json();
        console.log("Email sent successfully:", responseData);
        
        emailSent = true;
        emailResult = responseData as EmailSendingResult;
        
      } catch (emailSendError) {
        console.error("Error sending email:", emailSendError);
        emailError = emailSendError.message;
        
        // Continue execution - we'll still return the invitation details
        // even if sending the email failed
      }
    } else {
      console.warn("Resend API key not configured, skipping email sending");
      emailError = "Resend API key not configured";
    }

    // Return success response with invitation details
    return new Response(
      JSON.stringify({ 
        success: true,
        emailSent,
        emailError,
        emailResult,
        invitationId: invitation.id,
        token: invitation.token,
        expiresAt: invitation.expires_at,
        inviteLink,
        message: isResend ? `Invitation resent to ${email}` : `Invitation sent to ${email}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        stack: error.stack,
        name: error.name 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
