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
  isShareLink?: boolean;
  emailError?: string;
  email?: string;
  emailErrorCode?: string;
  emailResult?: any;
  message?: string;
}

interface ShareLinks {
  client?: string;
  coach?: string;
  admin?: string;
}

const InvitationsPage: React.FC = () => {
  const [shareLinks, setShareLinks] = useState<ShareLinks>({});
  const [inviteLink, setInviteLink] = useState('');
  const [isShareableLink, setIsShareableLink] = useState(false);
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
    enabled: currentUserType === 'admin',
    refetchInterval: 10000
  });
  
  useEffect(() => {
    if (invitations && invitations.length > 0) {
      const shareableLinks: ShareLinks = {};
      
      invitations.forEach(inv => {
        if (inv.is_share_link && 
            inv.accepted === false && 
            new Date(inv.expires_at) > new Date() && 
            inv.share_link_type) {
          
          const link = `${window.location.origin}/register?token=${inv.token}&type=${inv.share_link_type}`;
          
          if (!shareableLinks[inv.share_link_type as keyof ShareLinks] || 
              new Date(inv.created_at) > new Date(invitations.find(i => 
                i.token === shareableLinks[inv.share_link_type as keyof ShareLinks]?.split('token=')[1]?.split('&')[0]
              )?.created_at || 0)) {
            shareableLinks[inv.share_link_type as keyof ShareLinks] = link;
          }
        }
      });
      
      setShareLinks(shareableLinks);
    }
  }, [invitations]);
  
  const sendInvitation = useMutation({
    mutationFn: async ({ email, userType }: { email: string; userType: 'client' | 'coach' | 'admin' }): Promise<InvitationResponse> => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const accessToken = currentSession?.access_token;
        
        if (!accessToken) {
          throw new Error("Authentication token is missing. Please log in again.");
        }
        
        const siteUrl = window.location.origin;
        
        console.log("Invoking send-invitation edge function with payload:", { email, userType, siteUrl });
        
        const edgeFunctionResponse = await supabase.functions.invoke('send-invitation', {
          body: { email, userType, siteUrl },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        console.log("Edge function response:", edgeFunctionResponse);
        
        if (edgeFunctionResponse.error) {
          console.error("Edge function error:", edgeFunctionResponse.error);
          throw new Error(`Email service error: ${edgeFunctionResponse.error.message || 'Unknown error'}`);
        }
        
        const responseData = edgeFunctionResponse.data;
        
        return {
          success: true,
          emailSent: responseData?.emailSent || false,
          invitationId: responseData?.invitationId,
          token: responseData?.token,
          expiresAt: responseData?.expiresAt,
          inviteLink: responseData?.inviteLink,
          isShareLink: responseData?.isShareLink || false,
          emailError: responseData?.emailError,
          email,
          emailResult: responseData?.emailResult,
          message: responseData?.message
        };
      } catch (error: any) {
        console.error("Error in sendInvitation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setInviteLink(data.inviteLink);
      setIsShareableLink(data.isShareLink || false);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      if (data.emailSent) {
        toast.success(`Invitation sent to ${data.email || 'user'} successfully! ${data.message || ''}`);
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

  const createShareLink = useMutation({
    mutationFn: async (userType: 'client' | 'coach' | 'admin'): Promise<InvitationResponse> => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const accessToken = currentSession?.access_token;
        
        if (!accessToken) {
          throw new Error("Authentication token is missing. Please log in again.");
        }
        
        const siteUrl = window.location.origin;
        
        console.log("Invoking send-invitation edge function to create share link:", { userType, siteUrl });
        
        const edgeFunctionResponse = await supabase.functions.invoke('send-invitation', {
          body: { 
            userType, 
            siteUrl,
            generateShareLink: true
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        console.log("Edge function response for share link:", edgeFunctionResponse);
        
        if (edgeFunctionResponse.error) {
          console.error("Edge function error:", edgeFunctionResponse.error);
          throw new Error(`Share link error: ${edgeFunctionResponse.error.message || 'Unknown error'}`);
        }
        
        const responseData = edgeFunctionResponse.data;
        
        return {
          success: true,
          emailSent: false,
          invitationId: responseData?.invitationId,
          token: responseData?.token,
          expiresAt: responseData?.expiresAt,
          inviteLink: responseData?.inviteLink,
          isShareLink: true,
          message: responseData?.message
        };
      } catch (error: any) {
        console.error("Error creating share link:", error);
        throw error;
      }
    },
    onSuccess: (data, userType) => {
      setShareLinks(prev => ({
        ...prev,
        [userType]: data.inviteLink
      }));
      
      setInviteLink(data.inviteLink);
      setIsShareableLink(true);
      
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      toast.success(`Shareable ${userType} registration link created successfully!`, {
        duration: 5000
      });
    },
    onError: (error: Error) => {
      console.error("Share link error details:", error);
      toast.error(`Failed to create shareable link: ${error.message}`);
    }
  });
  
  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation): Promise<InvitationResponse> => {
      try {
        setResendingInvitations(prev => ({ ...prev, [invitation.id]: true }));
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const accessToken = currentSession?.access_token;
        
        if (!accessToken) {
          throw new Error("Authentication token is missing. Please log in again.");
        }
        
        const siteUrl = window.location.origin;
        
        const payload = {
          email: invitation.email,
          userType: invitation.user_type,
          siteUrl,
          resend: true,
          invitationId: invitation.id
        };
        
        console.log("Invoking send-invitation edge function for resend with payload:", payload);
        
        const edgeFunctionResponse = await supabase.functions.invoke('send-invitation', {
          body: payload,
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        console.log("Edge function response for resend:", edgeFunctionResponse);
        
        if (edgeFunctionResponse.error) {
          console.error("Edge function error for resend:", edgeFunctionResponse.error);
          throw new Error(`Email service error: ${edgeFunctionResponse.error.message || 'Unknown error'}`);
        }
        
        const responseData = edgeFunctionResponse.data;
        return {
          success: true,
          emailSent: responseData?.emailSent || false,
          invitationId: responseData?.invitationId,
          token: responseData?.token,
          expiresAt: responseData?.expiresAt,
          inviteLink: responseData?.inviteLink,
          isShareLink: responseData?.isShareLink || false,
          email: invitation.email,
          emailError: responseData?.emailError,
          message: responseData?.message
        };
      } catch (error: any) {
        console.error("Error in resendInvitation:", error);
        throw error;
      }
    },
    onSuccess: (data, invitation) => {
      setResendingInvitations(prev => ({ ...prev, [invitation.id]: false }));
      
      if (data.isShareLink && invitation.user_type) {
        setShareLinks(prev => ({
          ...prev,
          [invitation.user_type]: data.inviteLink
        }));
      }
      
      setInviteLink(data.inviteLink);
      setIsShareableLink(data.isShareLink || false);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      if (data.emailSent) {
        toast.success(`Invitation resent to ${invitation.email} successfully! ${data.message || ''}`);
      } else if (data.isShareLink) {
        toast.success(`Shareable link refreshed successfully!`);
      } else {
        toast.info(`Invitation updated for ${invitation.email}. ${data.emailError ? `Email error: ${data.emailError}.` : 'Email service is unavailable.'} Please share the invitation link manually.`, {
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
  
  const handleCreateShareLink = async (userType: 'client' | 'coach' | 'admin') => {
    return createShareLink.mutateAsync(userType);
  };
  
  const handleResendInvite = (invitation: Invitation) => {
    resendInvitation.mutate(invitation);
  };

  const handleCopyInvite = (token: string, userType: string) => {
    const link = `${window.location.origin}/register?token=${token}&type=${userType}`;
    
    const isShareLink = !!invitations?.find(inv => inv.token === token)?.is_share_link;
    if (isShareLink) {
      setShareLinks(prev => ({
        ...prev,
        [userType]: link
      }));
    }
    
    setInviteLink(link);
    setIsShareableLink(isShareLink);
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
          
          <div className="flex flex-wrap gap-2">
            <InvitationForm 
              onInvite={handleInvite}
              onCreateShareLink={handleCreateShareLink} 
              isLoading={sendInvitation.isPending || createShareLink.isPending} 
            />
            
            {shareLinks.client && (
              <InvitationLinkDialog 
                inviteLink={shareLinks.client} 
                isShareLink={true}
                userType="client"
                buttonLabel="Client Registration Link"
              />
            )}
            
            {shareLinks.coach && (
              <InvitationLinkDialog 
                inviteLink={shareLinks.coach} 
                isShareLink={true}
                userType="coach"
                buttonLabel="Coach Registration Link"
              />
            )}
            
            {shareLinks.admin && (
              <InvitationLinkDialog 
                inviteLink={shareLinks.admin} 
                isShareLink={true}
                userType="admin"
                buttonLabel="Admin Registration Link"
              />
            )}
            
            {inviteLink && !isShareableLink && (
              <InvitationLinkDialog 
                inviteLink={inviteLink} 
                isShareLink={false}
              />
            )}
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
