
import React, { useState } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Invitation } from '@/components/admin/InvitationTable';
import { PendingInvitationsTab } from '@/components/admin/PendingInvitationsTab';
import { ExpiredInvitationsTab } from '@/components/admin/ExpiredInvitationsTab';
import { AcceptedInvitationsTab } from '@/components/admin/AcceptedInvitationsTab';
import { InvitationForm } from '@/components/admin/InvitationForm';
import { InvitationLinkDialog } from '@/components/admin/InvitationLinkDialog';

const InvitationsPage: React.FC = () => {
  const [inviteLink, setInviteLink] = useState('');
  const [resendingInvitations, setResendingInvitations] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userType: currentUserType, session } = useAuth();
  
  React.useEffect(() => {
    if (currentUserType !== 'admin') {
      navigate('/admin');
    }
  }, [currentUserType, navigate]);

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
    enabled: currentUserType === 'admin'
  });
  
  const sendInvitation = useMutation({
    mutationFn: async ({ email, userType }: { email: string; userType: 'client' | 'coach' | 'admin' }) => {
      // Make sure we have the site URL
      const siteUrl = window.location.origin;
      
      console.log("Session token available:", !!session?.access_token);
      console.log("Sending invitation request to:", email, "user type:", userType);
      
      // Use Supabase functions.invoke with proper headers
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: { email, userType, siteUrl },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });
      
      if (error) {
        console.error("Error invoking send-invitation function:", error);
        throw new Error(error.message || "Failed to send invitation");
      }
      
      console.log("Invitation response:", data);
      return data;
    },
    onSuccess: (data, variables) => {
      setInviteLink(data.inviteLink || `${window.location.origin}/register?token=${data.token}&type=${variables.userType}`);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success(`Invitation sent to ${variables.email}`);
    },
    onError: (error: Error) => {
      console.error("Invitation error details:", error);
      toast.error(`Failed to send invitation: ${error.message}`);
    }
  });
  
  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation) => {
      // Mark this invitation as being resent
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: true }));
      
      const siteUrl = window.location.origin;
      
      // Call the same function but passing the original invitation data
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: { 
          email: invitation.email, 
          userType: invitation.user_type, 
          siteUrl,
          resend: true,
          invitationId: invitation.id
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });
      
      if (error) {
        console.error("Resend invitation function error:", error);
        throw new Error(error.message || "Failed to resend invitation");
      }
      
      if (data.error) {
        console.error("Resend invitation error from response:", data.error);
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data, invitation) => {
      // Clear the resending state
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: false }));
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      // If we have the invite link, update it
      if (data.inviteLink) {
        setInviteLink(data.inviteLink);
      }
      
      toast.success(`Invitation resent to ${invitation.email}`);
    },
    onError: (error: Error, invitation) => {
      // Clear the resending state
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: false }));
      console.error("Resend invitation error:", error);
      toast.error(`Failed to resend invitation: ${error.message}`);
    }
  });
  
  const handleInvite = async (email: string, userType: 'client' | 'coach' | 'admin') => {
    return sendInvitation.mutateAsync({ email, userType });
  };
  
  const handleResendInvite = (invitation: Invitation) => {
    resendInvitation.mutate(invitation);
  };

  const handleCopyInvite = (token: string, userType: string) => {
    const link = `${window.location.origin}/register?token=${token}&type=${userType}`;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
    toast.success('Invitation link copied to clipboard');
  };

  const pendingInvitations = invitations?.filter(inv => 
    !inv.accepted && new Date(inv.expires_at) > new Date()
  ) || [];
  
  const expiredInvitations = invitations?.filter(inv => 
    !inv.accepted && new Date(inv.expires_at) <= new Date()
  ) || [];
  
  const acceptedInvitations = invitations?.filter(inv => inv.accepted) || [];

  if (currentUserType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Manage Invitations">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Invitations</h2>
          
          <div className="flex space-x-2">
            <InvitationForm 
              onInvite={handleInvite} 
              isLoading={sendInvitation.isPending} 
            />
            
            {inviteLink && <InvitationLinkDialog inviteLink={inviteLink} />}
          </div>
        </div>
        
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired ({expiredInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedInvitations.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="pt-4">
            <PendingInvitationsTab 
              invitations={pendingInvitations}
              isLoading={isLoading}
              onCopyInvite={handleCopyInvite}
              onResendInvite={handleResendInvite}
              isResending={resendingInvitations}
            />
          </TabsContent>
          
          <TabsContent value="expired" className="pt-4">
            <ExpiredInvitationsTab 
              invitations={expiredInvitations}
              isLoading={isLoading}
              onResendInvite={handleResendInvite}
              isResending={resendingInvitations}
            />
          </TabsContent>
          
          <TabsContent value="accepted" className="pt-4">
            <AcceptedInvitationsTab 
              invitations={acceptedInvitations}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default InvitationsPage;
