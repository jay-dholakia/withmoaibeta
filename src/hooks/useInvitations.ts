
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  sendInvitation as sendInvitationService,
  resendInvitation as resendInvitationService,
  createShareableLink as createShareableLinkService,
  getInvitationsGroupedByStatus,
  Invitation,
  InvitationResponse
} from '@/utils/invitationService';

export function useInvitations(session: { access_token?: string } | null) {
  const [inviteLink, setInviteLink] = useState('');
  const [lastEmailStatus, setLastEmailStatus] = useState<{
    sent: boolean;
    email?: string;
    error?: string;
    timestamp: Date;
  } | null>(null);
  const [resendingInvitations, setResendingInvitations] = useState<Record<string, boolean>>({});
  
  const queryClient = useQueryClient();
  
  // Fetch invitations
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as Invitation[];
    },
    enabled: !!session?.access_token,
    refetchInterval: 10000
  });

  // Group invitations by status
  const groupedInvitations = invitations 
    ? getInvitationsGroupedByStatus(invitations) 
    : { pending: [], expired: [], accepted: [] };
  
  // Send invitation mutation
  const sendInvitation = useMutation({
    mutationFn: async ({ email, userType }: { email: string; userType: 'client' | 'coach' | 'admin' }) => {
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      return sendInvitationService(email, userType, session.access_token);
    },
    onSuccess: (data) => {
      setInviteLink(data.inviteLink);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      setLastEmailStatus({
        sent: data.emailSent,
        email: data.email || data.inviteLink.split('token=')[1]?.split('&')[0],
        error: data.emailError,
        timestamp: new Date()
      });
      
      if (data.emailSent) {
        toast.success(`Invitation sent successfully!`, {
          description: "Email delivered via Resend."
        });
      } else {
        toast.info(`Invitation created, but email could not be sent: ${data.emailError || 'Unknown error'}`, {
          duration: 8000
        });
      }
    },
    onError: (error: Error) => {
      console.error("Invitation error details:", error);
      toast.error(`Failed to create invitation: ${error.message}`);
    }
  });

  // Create shareable link mutation
  const createShareableLink = useMutation({
    mutationFn: async (userType: 'client' | 'coach' | 'admin') => {
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      return createShareableLinkService(userType, session.access_token);
    },
    onSuccess: (data) => {
      console.log("Shareable link created:", data);
      setInviteLink(data.inviteLink);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      toast.success(`Shareable invitation link created successfully!`);
      
      if (data.inviteLink) {
        navigator.clipboard.writeText(data.inviteLink);
        toast.info('Link copied to clipboard');
      } else {
        console.error("Missing invite link in response:", data);
        toast.error("Failed to generate link");
      }
    },
    onError: (error: Error) => {
      console.error("Shareable link error details:", error);
      toast.error(`Failed to create shareable link: ${error.message}`);
    }
  });

  // Resend invitation mutation
  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation) => {
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: true }));
      
      return resendInvitationService(invitation, session.access_token);
    },
    onSuccess: (data, invitation) => {
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: false }));
      setInviteLink(data.inviteLink);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      if (invitation.is_share_link) {
        toast.success(`Shareable link refreshed successfully!`);
        if (data.inviteLink) {
          navigator.clipboard.writeText(data.inviteLink);
          toast.info('New link copied to clipboard');
        }
        return;
      }
      
      setLastEmailStatus({
        sent: data.emailSent,
        email: invitation.email,
        error: data.emailError,
        timestamp: new Date()
      });
      
      if (data.emailSent) {
        toast.success(`Invitation resent to ${invitation.email} successfully!`, {
          description: "Email delivered via Resend."
        });
      } else {
        toast.info(`Invitation updated for ${invitation.email}. Email service is unavailable - please share the invitation link manually.`, {
          duration: 5000
        });
      }
    },
    onError: (error: Error, invitation) => {
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: false }));
      console.error("Resend invitation error:", error);
      toast.error(`Failed to update invitation: ${error.message}`);
    }
  });

  // Setup subscription to realtime updates
  const setupRealtimeSubscription = () => {
    console.log('Setting up realtime subscription for invitations');
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations'
        },
        (payload) => {
          console.log('Realtime invitation update:', payload);
          queryClient.invalidateQueries({ queryKey: ['invitations'] });
          
          if (payload.eventType === 'UPDATE' && 
              payload.new.accepted === true && 
              payload.old.accepted === false) {
            toast.success(`Invitation for ${payload.new.email} has been accepted!`);
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  };

  // Helper functions
  const handleInvite = async (email: string, userType: 'client' | 'coach' | 'admin') => {
    return sendInvitation.mutateAsync({ email, userType });
  };

  const handleCreateShareableLink = (userType: 'client' | 'coach' | 'admin') => {
    createShareableLink.mutate(userType);
  };

  const handleResendInvite = (invitation: Invitation) => {
    resendInvitation.mutate(invitation);
  };

  const handleCopyInvite = (token: string, userType: string) => {
    const link = `${window.location.origin}/register?token=${token}&type=${userType}`;
    navigator.clipboard.writeText(link);
    toast.success('Invitation link copied to clipboard');
  };

  return {
    invitations: groupedInvitations,
    isLoading,
    inviteLink,
    lastEmailStatus,
    resendingInvitations,
    setupRealtimeSubscription,
    sendInvitation: {
      mutate: handleInvite,
      isPending: sendInvitation.isPending,
    },
    createShareableLink: {
      mutate: handleCreateShareableLink,
      isPending: createShareableLink.isPending,
    },
    resendInvitation: {
      mutate: handleResendInvite,
    },
    handleCopyInvite,
  };
}
