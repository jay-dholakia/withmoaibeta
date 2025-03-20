
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
    mutationFn: async ({ email, userType }: { email: string; userType: 'client' | 'coach' }) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email, userType })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      setInviteLink(`${window.location.origin}/register?token=${data.token}&type=${variables.userType}`);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success(`Invitation sent to ${variables.email}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    }
  });
  
  const handleInvite = (email: string, userType: 'client' | 'coach') => {
    sendInvitation.mutate({ email, userType });
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
            />
          </TabsContent>
          
          <TabsContent value="expired" className="pt-4">
            <ExpiredInvitationsTab 
              invitations={expiredInvitations}
              isLoading={isLoading}
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
