
import { supabase } from '@/integrations/supabase/client';

export interface Invitation {
  id: string;
  email: string;
  user_type: string;
  created_at: string;
  accepted: boolean;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  is_share_link?: boolean;
  share_link_type?: string;
}

export interface InvitationResponse {
  success: boolean;
  emailSent: boolean;
  invitationId: string;
  token: string;
  expiresAt: string;
  inviteLink: string;
  emailError?: string;
  message?: string;
  emailData?: any;
  email?: string;
}

export const sendInvitation = async (
  email: string, 
  userType: 'client' | 'coach' | 'admin',
  accessToken: string
): Promise<InvitationResponse> => {
  const siteUrl = window.location.origin;
  
  const payload = {
    email,
    userType,
    siteUrl
  };
  
  console.log("Sending invitation with payload:", payload);
  
  const response = await supabase.functions.invoke('send-invitation', {
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.error) {
    console.error("Error invoking send-invitation function:", response.error);
    throw new Error(response.error.message || 'Failed to send invitation');
  }
  
  return {
    ...response.data,
    email: email
  } as InvitationResponse;
};

export const createShareableLink = async (
  userType: 'client' | 'coach' | 'admin',
  accessToken: string
): Promise<InvitationResponse> => {
  const siteUrl = window.location.origin;
  
  const payload = {
    userType,
    siteUrl,
    isShareLink: true
  };
  
  console.log("Creating shareable link with payload:", payload);
  
  // Stringifying the payload explicitly to ensure it's not empty
  const stringifiedPayload = JSON.stringify(payload);
  console.log("Stringified payload:", stringifiedPayload);
  
  const response = await supabase.functions.invoke('send-invitation', {
    body: payload, // Supabase SDK should handle this correctly, but we're logging to verify
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.error) {
    console.error("Error invoking send-invitation function:", response.error);
    throw new Error(response.error.message || 'Failed to create shareable invitation link');
  }
  
  console.log("Shareable link raw response:", response);
  console.log("Shareable link response data:", response.data);
  
  // Ensure we have a complete invitation link
  const data = response.data as InvitationResponse;
  
  // If we don't have an invite link but have a token, construct the link
  if (!data?.inviteLink && data?.token) {
    data.inviteLink = `${siteUrl}/register?token=${data.token}&type=${userType}`;
    console.log("Generated invite link:", data.inviteLink);
  } else if (!data) {
    // Handle completely empty response
    console.error("Empty response data received");
    throw new Error("Failed to create shareable invitation link - empty response");
  }
  
  return data;
};

export const resendInvitation = async (
  invitation: Invitation,
  accessToken: string
): Promise<InvitationResponse> => {
  const siteUrl = window.location.origin;
  
  const payload = {
    email: invitation.email,
    userType: invitation.user_type,
    siteUrl,
    resend: true,
    invitationId: invitation.id,
    isShareLink: invitation.is_share_link
  };
  
  console.log("Resending invitation with payload:", payload);
  
  const response = await supabase.functions.invoke('send-invitation', {
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.error) {
    console.error("Error invoking send-invitation function:", response.error);
    throw new Error(response.error.message || 'Failed to resend invitation');
  }
  
  const data = response.data as InvitationResponse;
  
  // Ensure we have a complete invitation link
  if (!data.inviteLink && data.token) {
    data.inviteLink = `${siteUrl}/register?token=${data.token}&type=${invitation.user_type}`;
  }
  
  return {
    ...data,
    email: invitation.email
  };
};

export const getInvitationsGroupedByStatus = (invitations: Invitation[]) => {
  const now = new Date();
  
  const pending = invitations.filter(inv => 
    inv.accepted === false && new Date(inv.expires_at) > now
  );
  
  const expired = invitations.filter(inv => 
    inv.accepted === false && new Date(inv.expires_at) <= now
  );
  
  const accepted = invitations.filter(inv => 
    inv.accepted === true
  );
  
  return { pending, expired, accepted };
};
