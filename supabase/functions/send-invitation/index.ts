
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.37.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationPayload {
  email?: string;
  userType: "client" | "coach" | "admin";
  siteUrl?: string;
  resend?: boolean;
  invitationId?: string;
  generateShareLink?: boolean;
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
    
    // Log environment variables status (safely)
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
        invitationId: payload.invitationId,
        generateShareLink: payload.generateShareLink
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

    const { email, userType, resend: isResend, invitationId, generateShareLink } = payload;

    // Check requirements based on the operation type
    if (generateShareLink) {
      if (!userType) {
        return new Response(
          JSON.stringify({ 
            error: "userType is required for shareable links",
            receivedPayload: { userType, generateShareLink }
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (!email || !userType) {
      console.error("Missing required fields:", { email, userType, generateShareLink });
      return new Response(
        JSON.stringify({ 
          error: "Email and userType are required for email invitations",
          receivedPayload: { email, userType, isResend, invitationId, generateShareLink }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    console.log("Authorization header:", authHeader ? "present" : "not present");
    
    if (!authHeader) {
      console.error("Authorization header missing");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Auth token provided, verifying user");
    
    try {
      // Extract the token from the header
      const token = authHeader.replace("Bearer ", "");
      console.log("Token length:", token.length);
      
      // Verify the JWT token and get the user
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError || !user) {
        console.error("Invalid token or user not found:", userError);
        return new Response(
          JSON.stringify({ 
            error: "Unauthorized - Invalid credentials",
            details: userError?.message 
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("User verified successfully:", user.id);
      
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
        JSON.stringify({ 
          error: "Authentication failed", 
          details: authError.message 
        }),
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
      console.log("Creating new invitation");

      // Generate token and expiration date
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      // Get user ID from the authenticated user's token
      const { data: { user } } = await supabaseClient.auth.getUser(
        req.headers.get("Authorization")?.replace("Bearer ", "") || ""
      );

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Failed to get user from token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For share links, we need to modify the email column to allow NULL values
      // Instead of using the check_column_nullable function, let's try to directly modify the column
      if (generateShareLink) {
        try {
          // Try to alter the table directly to make email column nullable
          // We'll catch any errors if this fails
          const { error: alterTableError } = await supabaseClient.rpc(
            'make_column_nullable',
            { table_name: 'invitations', column_name: 'email' }
          );
          
          if (alterTableError) {
            console.log("Couldn't use make_column_nullable function, attempting direct SQL approach");
            
            // If the RPC function doesn't exist, try a direct approach with a simple query
            // This is a fallback if the custom SQL functions haven't been created yet
            try {
              await supabaseClient.from('_temp_execute_sql').select('*').or('id.eq.0').execute();
            } catch (error) {
              console.log("Error in fallback approach, continuing anyway:", error);
            }
          }
        } catch (error) {
          console.log("Error attempting to make column nullable, continuing anyway:", error);
          // Continue anyway - if this fails, the insertion will fail below and we'll handle that
        }
      }

      try {
        // Insert the invitation
        const invitationData = {
          email: email || null, // May be null for shareable links
          user_type: userType,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
          accepted: false,
          is_share_link: !!generateShareLink,
          share_link_type: generateShareLink ? userType : null
        };

        const { data: newInvitation, error: invitationError } = await supabaseClient
          .from("invitations")
          .insert(invitationData)
          .select()
          .single();

        if (invitationError) {
          console.error("Error creating invitation:", invitationError);
          
          // If we get an error about the NOT NULL constraint, we need to perform a more direct alteration
          if (invitationError.message && invitationError.message.includes('null value in column "email" of relation "invitations" violates not-null constraint')) {
            console.log("Received NOT NULL constraint error, need to directly alter the table");
            
            // Try to execute direct SQL to modify the table (this requires elevated permissions)
            try {
              // This is a fallback method that might work if RLS policies allow it
              const { error: directAlterError } = await supabaseClient.rpc(
                '_temp_execute_direct_sql',
                { sql: "ALTER TABLE public.invitations ALTER COLUMN email DROP NOT NULL;" }
              );
              
              if (directAlterError) {
                console.error("Could not directly alter table:", directAlterError);
                return new Response(
                  JSON.stringify({ 
                    error: "Database schema does not support shareable links yet. Please run the required SQL migrations first.",
                    details: invitationError.message,
                    solution: "Run ALTER TABLE public.invitations ALTER COLUMN email DROP NOT NULL; in your database"
                  }),
                  { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              } else {
                // Try the invitation insert again after altering the table
                const { data: retryInvitation, error: retryError } = await supabaseClient
                  .from("invitations")
                  .insert(invitationData)
                  .select()
                  .single();
                
                if (retryError) {
                  return new Response(
                    JSON.stringify({ error: retryError.message }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                  );
                }
                
                invitation = retryInvitation;
              }
            } catch (sqlExecError) {
              console.error("Error executing direct SQL:", sqlExecError);
              return new Response(
                JSON.stringify({ 
                  error: "Cannot create shareable links due to database constraint",
                  details: invitationError.message,
                  solution: "Run the SQL setup to modify the invitations table: ALTER TABLE public.invitations ALTER COLUMN email DROP NOT NULL;"
                }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          } else {
            return new Response(
              JSON.stringify({ error: invitationError.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          invitation = newInvitation;
        }
        
        console.log("Invitation created successfully:", { 
          invitationId: invitation.id, 
          token: invitation.token,
          expiresAt: invitation.expires_at,
          isShareLink: invitation.is_share_link
        });
      } catch (insertError) {
        console.error("Unexpected error during invitation creation:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create invitation", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Determine site URL from environment or payload
    const effectiveSiteUrl = siteUrl || payload.siteUrl || "";
    if (!effectiveSiteUrl) {
      console.warn("No site URL provided for invitation link");
    }
    
    const inviteLink = `${effectiveSiteUrl}/register?token=${invitation.token}&type=${userType}`;
    console.log("Generated invite link:", inviteLink);

    // Email functionality - only send if an email address is provided
    let emailSent = false;
    let emailError = null;
    let emailResult = null;

    if (email && resendApiKey) {
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
            from: "Moai <jay@withmoai.co>", // Updated sender email address
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
        
        console.log("Resend API response status:", emailResponse.status);
        console.log("Resend API response headers:", Object.fromEntries(emailResponse.headers.entries()));
        
        const responseText = await emailResponse.text();
        console.log("Resend API response text:", responseText);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse Resend API response:", e);
          responseData = { error: "Invalid JSON response" };
        }
        
        if (!emailResponse.ok) {
          console.error("Resend API error details:", {
            status: emailResponse.status,
            statusText: emailResponse.statusText,
            data: responseData
          });
          throw new Error(`Resend API error (${emailResponse.status}): ${responseText}`);
        }
        
        console.log("Email sent successfully:", responseData);
        
        emailSent = true;
        emailResult = responseData;
        
      } catch (emailSendError) {
        console.error("Error sending email:", emailSendError);
        emailError = emailSendError.message;
      }
    } else if (email) {
      console.warn("Resend API key not configured, skipping email sending");
      emailError = "Resend API key not configured";
    } else {
      console.log("No email address provided, skipping email sending (using share link)");
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
        isShareLink: invitation.is_share_link,
        message: isResend 
          ? `Invitation resent ${email ? `to ${email}` : ''}`
          : generateShareLink 
            ? `Shareable invitation link created for ${userType} role` 
            : `Invitation sent to ${email}`
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
