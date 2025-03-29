
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
  
  return response.data as InvitationResponse;
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
    invitationId: invitation.id
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
  
  return response.data as InvitationResponse;
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
