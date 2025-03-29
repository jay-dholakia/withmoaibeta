import React, { useState, useEffect } from 'react';
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

interface InvitationResponse {
  success: boolean;
  emailSent: boolean;
  invitationId: string;
  token: string;
  expiresAt: string;
  inviteLink: string;
  emailError?: string;
  email?: string;
  emailErrorCode?: string;
  emailResult?: any;
}

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
      
      const debugEmail = "jdholakia12@gmail.com";
      const debugInvitation = data?.find(inv => inv.email === debugEmail);
      if (debugInvitation) {
        console.log(`Debug - Found invitation for ${debugEmail}:`, debugInvitation);
        console.log(`Debug - Invitation accepted: ${debugInvitation.accepted}`);
        console.log(`Debug - Is accepted value a boolean?`, typeof debugInvitation.accepted === 'boolean');
        console.log(`Debug - Invitation accepted_at:`, debugInvitation.accepted_at);
      } else {
        console.log(`Debug - Invitation for ${debugEmail} not found in results`);
      }
      
      return data as Invitation[];
    },
    enabled: currentUserType === 'admin',
    refetchInterval: 10000
  });
  
  useEffect(() => {
    if (currentUserType !== 'admin') return;
    
    console.log('Setting up realtime subscription for invitations');
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes: INSERT, UPDATE, DELETE
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
  }, [currentUserType, queryClient]);
  
  const sendInvitation = useMutation({
    mutationFn: async ({ email, userType }: { email: string; userType: 'client' | 'coach' | 'admin' }): Promise<InvitationResponse> => {
      try {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
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
        
        const siteUrl = window.location.origin;
        const inviteLink = `${siteUrl}/register?token=${token}&type=${userType}`;
        
        try {
          console.log("Invoking send-invitation edge function");
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
          
          const responseData = edgeFunctionResponse.data;
          if (responseData && responseData.emailSent === false) {
            console.warn("Email was not sent due to service error:", responseData.emailError);
            return {
              success: true,
              emailSent: false,
              invitationId: data.id,
              token: data.token,
              expiresAt: data.expires_at,
              inviteLink,
              emailError: responseData.emailError,
              emailErrorCode: responseData.emailErrorCode,
              email
            };
          }
          
          return {
            success: true,
            emailSent: true,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expires_at,
            inviteLink,
            email,
            emailResult: responseData?.emailResult
          };
        } catch (emailError) {
          console.error("Failed to send email, but invitation created:", emailError);
          return {
            success: true,
            emailSent: false,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expires_at,
            inviteLink,
            emailError: emailError.message,
            email
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
        console.log("Email send result:", data.emailResult);
      } else {
        toast.info(`Invitation created for ${data.email || 'user'}, but email could not be sent: ${data.emailError || 'Unknown error'}. Please share the invitation link manually.`, {
          duration: 8000
        });
      }
    },
    onError: (error: Error) => {
      console.error("Invitation error details:", error);
      toast.error(`Failed to create invitation: ${error.message}`);
    }
  });
  
  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation): Promise<InvitationResponse> => {
      try {
        setResendingInvitations(prev => ({ ...prev, [invitation.id]: true }));
        
        const newToken = crypto.randomUUID();
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);
        
        const { data, error } = await supabase
          .from('invitations')
          .update({
            token: newToken,
            expires_at: newExpiresAt.toISOString(),
            created_at: new Date().toISOString(),
            accepted: false,
            accepted_at: null
          })
          .eq('id', invitation.id)
          .select()
          .single();
        
        if (error) {
          console.error("Error updating invitation:", error);
          throw error;
        }
        
        const siteUrl = window.location.origin;
        const inviteLink = `${siteUrl}/register?token=${newToken}&type=${invitation.user_type}`;
        
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
          
          return {
            success: true,
            emailSent: true,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expires_at,
            inviteLink,
            email: invitation.email
          };
        } catch (emailError) {
          console.error("Failed to send email, but invitation updated:", emailError);
          return {
            success: true,
            emailSent: false,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expires_at,
            inviteLink,
            emailError: emailError.message,
            email: invitation.email
          };
        }
      } catch (error: any) {
        console.error("Error in resendInvitation:", error);
        throw error;
      }
    },
    onSuccess: (data, invitation) => {
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: false }));
      setInviteLink(data.inviteLink);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      if (data.emailSent) {
        toast.success(`Invitation resent to ${invitation.email} successfully!`);
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
    inv.accepted === false && new Date(inv.expires_at) > new Date()
  ) || [];
  
  const expiredInvitations = invitations?.filter(inv => 
    inv.accepted === false && new Date(inv.expires_at) <= new Date()
  ) || [];
  
  const acceptedInvitations = invitations?.filter(inv => 
    inv.accepted === true
  ) || [];

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
