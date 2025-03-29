
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
import { ShareInvitationDialog } from '@/components/admin/ShareInvitationDialog';
import { ShareableLinkDialog } from '@/components/admin/ShareableLinkDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { 
  sendInvitation as sendInvitationService,
  resendInvitation as resendInvitationService,
  createShareableLink as createShareableLinkService,
  getInvitationsGroupedByStatus,
  InvitationResponse
} from '@/utils/invitationService';

const InvitationsPage: React.FC = () => {
  const [inviteLink, setInviteLink] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareInfo, setShareInfo] = useState<{
    link: string;
    email: string;
    userType: string;
  }>({ link: '', email: '', userType: '' });
  const [lastEmailStatus, setLastEmailStatus] = useState<{
    sent: boolean;
    email?: string;
    error?: string;
    timestamp: Date;
  } | null>(null);
  const [resendingInvitations, setResendingInvitations] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userType: currentUserType, session } = useAuth();
  
  useEffect(() => {
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
    if (currentUserType !== 'admin') return;
    
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
  }, [currentUserType, queryClient]);

  const sendInvitation = useMutation({
    mutationFn: async ({ email, userType }: { email: string; userType: 'client' | 'coach' | 'admin' }) => {
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      return sendInvitationService(email, userType, session.access_token);
    },
    onSuccess: (data) => {
      // Store the complete invite link
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

  const createShareableLink = useMutation({
    mutationFn: async (userType: 'client' | 'coach' | 'admin') => {
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      return createShareableLinkService(userType, session.access_token);
    },
    onSuccess: (data) => {
      console.log("Shareable link created:", data);
      // Make sure we're storing the full link
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

  const handleShareInvite = (token: string, userType: string, email: string) => {
    const link = `${window.location.origin}/register?token=${token}&type=${userType}`;
    
    setShareInfo({
      link,
      email,
      userType
    });
    
    setShareDialogOpen(true);
  };

  const { pending: pendingInvitations, expired: expiredInvitations, accepted: acceptedInvitations } = 
    invitations ? getInvitationsGroupedByStatus(invitations) : { pending: [], expired: [], accepted: [] };

  if (currentUserType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Manage Invitations">
      <div className="space-y-6">
        {lastEmailStatus && (
          <Alert variant={lastEmailStatus.sent ? "default" : "destructive"} className="mb-4">
            <div className="flex items-start">
              {lastEmailStatus.sent ? (
                <Info className="h-5 w-5 mr-2 text-blue-500" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              <AlertDescription>
                <p className="font-medium">
                  {lastEmailStatus.sent 
                    ? `Email sent successfully to ${lastEmailStatus.email}` 
                    : `Email could not be sent to ${lastEmailStatus.email}`
                  }
                </p>
                {!lastEmailStatus.sent && lastEmailStatus.error && (
                  <p className="text-sm mt-1">{lastEmailStatus.error}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(lastEmailStatus.timestamp).toLocaleTimeString()}
                </p>
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Invitations</h2>
          
          <div className="flex space-x-2">
            <InvitationForm 
              onInvite={handleInvite} 
              isLoading={sendInvitation.isPending} 
            />
            
            <ShareableLinkDialog
              onCreateShareableLink={handleCreateShareableLink}
              isLoading={createShareableLink.isPending}
            />
            
            {inviteLink && <InvitationLinkDialog inviteLink={inviteLink} />}
            
            <ShareInvitationDialog 
              inviteLink={shareInfo.link}
              emailAddress={shareInfo.email}
              userType={shareInfo.userType}
              isOpen={shareDialogOpen}
              onClose={() => setShareDialogOpen(false)}
            />
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
              onShareInvite={handleShareInvite}
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
