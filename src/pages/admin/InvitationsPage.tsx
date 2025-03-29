
import React, { useEffect } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PendingInvitationsTab } from '@/components/admin/PendingInvitationsTab';
import { ExpiredInvitationsTab } from '@/components/admin/ExpiredInvitationsTab';
import { AcceptedInvitationsTab } from '@/components/admin/AcceptedInvitationsTab';
import { InvitationsHeader } from '@/components/admin/InvitationsHeader';
import { EmailStatusAlert } from '@/components/admin/EmailStatusAlert';
import { ShareInvitationDialog } from '@/components/admin/ShareInvitationDialog';
import { useInvitations } from '@/hooks/useInvitations';
import { Invitation } from '@/utils/invitationService';

const InvitationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userType: currentUserType, session } = useAuth();
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shareInfo, setShareInfo] = React.useState<{
    link: string;
    email: string;
    userType: string;
  }>({ link: '', email: '', userType: '' });
  
  // Redirect non-admin users
  useEffect(() => {
    if (currentUserType !== 'admin') {
      navigate('/admin');
    }
  }, [currentUserType, navigate]);

  // Use the custom hook
  const {
    invitations,
    isLoading,
    inviteLink,
    lastEmailStatus,
    resendingInvitations,
    setupRealtimeSubscription,
    sendInvitation,
    createShareableLink,
    resendInvitation,
    handleCopyInvite
  } = useInvitations(session);

  // Setup realtime subscription
  useEffect(() => {
    if (currentUserType !== 'admin') return;
    
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [currentUserType]);

  const handleShareInvite = (token: string, userType: string, email: string) => {
    const link = `${window.location.origin}/register?token=${token}&type=${userType}`;
    
    setShareInfo({
      link,
      email,
      userType
    });
    
    setShareDialogOpen(true);
  };

  if (currentUserType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Manage Invitations">
      <div className="space-y-6">
        <EmailStatusAlert status={lastEmailStatus} />

        <InvitationsHeader
          onInvite={sendInvitation.mutate}
          onCreateShareableLink={createShareableLink.mutate}
          isInviteLoading={sendInvitation.isPending}
          isShareLinkLoading={createShareableLink.isPending}
          inviteLink={inviteLink}
        />
        
        <ShareInvitationDialog 
          inviteLink={shareInfo.link}
          emailAddress={shareInfo.email}
          userType={shareInfo.userType}
          isOpen={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
        />
        
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({invitations.pending.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired ({invitations.expired.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({invitations.accepted.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="pt-4">
            <PendingInvitationsTab 
              invitations={invitations.pending}
              isLoading={isLoading}
              onCopyInvite={handleCopyInvite}
              onShareInvite={handleShareInvite}
              onResendInvite={resendInvitation.mutate}
              isResending={resendingInvitations}
            />
          </TabsContent>
          
          <TabsContent value="expired" className="pt-4">
            <ExpiredInvitationsTab 
              invitations={invitations.expired}
              isLoading={isLoading}
              onResendInvite={resendInvitation.mutate}
              isResending={resendingInvitations}
            />
          </TabsContent>
          
          <TabsContent value="accepted" className="pt-4">
            <AcceptedInvitationsTab 
              invitations={invitations.accepted}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default InvitationsPage;
