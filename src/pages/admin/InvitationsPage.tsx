
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
      try {
        // Generate token and expiration date directly
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Extending to 30 days from now
        
        // Using the supabase client directly to create the invitation
        const { data, error } = await supabase
          .from('invitations')
          .insert({
            email,
            user_type: userType,
            invited_by: session?.user.id,
            token,
            expires_at: expiresAt.toISOString(),
            accepted: false
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating invitation:", error);
          throw error;
        }
        
        console.log("Created invitation:", data);
        
        // Generate the invite link
        const siteUrl = window.location.origin;
        const inviteLink = `${siteUrl}/register?token=${token}&type=${userType}`;
        
        // Try to send the email via edge function, but don't block on it
        try {
          const edgeFunctionResponse = await supabase.functions.invoke('send-invitation', {
            body: {
              email,
              userType,
              siteUrl,
              invitationId: data.id
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log("Edge function response:", edgeFunctionResponse);
          
          if (edgeFunctionResponse.error) {
            console.error("Edge function error:", edgeFunctionResponse.error);
            throw new Error(`Email service error: ${edgeFunctionResponse.error.message || 'Unknown error'}`);
          }
          
          // If we get here, email was sent successfully
          return {
            success: true,
            emailSent: true,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expires_at,
            inviteLink
          };
        } catch (emailError) {
          console.error("Failed to send email, but invitation created:", emailError);
          // Return success with the invitation link even if email fails
          return {
            success: true,
            emailSent: false,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expires_at,
            inviteLink,
            emailError: emailError.message
          };
        }
      } catch (error: any) {
        console.error("Error in sendInvitation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setInviteLink(data.inviteLink);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      if (data.emailSent) {
        toast.success(`Invitation sent to ${data.email || 'user'} successfully!`);
      } else {
        toast.success(`Invitation created successfully!`);
        toast.info(`Email service is currently unavailable. Please copy and share the invitation link manually.`);
      }
    },
    onError: (error: Error) => {
      console.error("Invitation error details:", error);
      toast.error(`Failed to create invitation: ${error.message}`);
    }
  });
  
  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation) => {
      try {
        // Mark this invitation as being resent
        setResendingInvitations(prev => ({ ...prev, [invitation.id]: true }));
        
        // Generate a new token and expiration date
        const newToken = crypto.randomUUID();
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 30); // Extended to 30 days
        
        // Update the invitation
        const { data, error } = await supabase
          .from('invitations')
          .update({
            token: newToken,
            expires_at: newExpiresAt.toISOString(),
            created_at: new Date().toISOString(),
          })
          .eq('id', invitation.id)
          .select()
          .single();
        
        if (error) {
          console.error("Error updating invitation:", error);
          throw error;
        }
        
        // Generate the invite link
        const siteUrl = window.location.origin;
        const inviteLink = `${siteUrl}/register?token=${newToken}&type=${invitation.user_type}`;
        
        // Try to send email via edge function, but don't block on it
        try {
          const edgeFunctionResponse = await supabase.functions.invoke('send-invitation', {
            body: {
              email: invitation.email,
              userType: invitation.user_type,
              siteUrl,
              resend: true,
              invitationId: invitation.id
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log("Edge function response for resend:", edgeFunctionResponse);
          
          if (edgeFunctionResponse.error) {
            console.error("Edge function error for resend:", edgeFunctionResponse.error);
            throw new Error(`Email service error: ${edgeFunctionResponse.error.message || 'Unknown error'}`);
          }
          
          // If we get here, email was sent successfully
          return {
            success: true,
            emailSent: true,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expires_at,
            inviteLink
          };
        } catch (emailError) {
          console.error("Failed to send email, but invitation updated:", emailError);
          // Return success with the invitation link even if email fails
          return {
            success: true,
            emailSent: false,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expires_at,
            inviteLink,
            emailError: emailError.message
          };
        }
      } catch (error: any) {
        console.error("Error in resendInvitation:", error);
        throw error;
      }
    },
    onSuccess: (data, invitation) => {
      // Clear the resending state
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: false }));
      setInviteLink(data.inviteLink);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      if (data.emailSent) {
        toast.success(`Invitation resent to ${invitation.email} successfully!`);
      } else {
        toast.success(`Invitation updated successfully!`);
        toast.info(`Email service is currently unavailable. Please copy and share the invitation link manually.`);
      }
    },
    onError: (error: Error, invitation) => {
      // Clear the resending state
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: false }));
      console.error("Resend invitation error:", error);
      toast.error(`Failed to update invitation: ${error.message}`);
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

  // Filter invitations by their status
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
