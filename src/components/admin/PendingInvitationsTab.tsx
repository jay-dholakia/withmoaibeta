
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InvitationTable, Invitation } from './InvitationTable';

interface PendingInvitationsTabProps {
  invitations: Invitation[];
  isLoading: boolean;
  onCopyInvite: (token: string, userType: string) => void;
  onShareInvite: (token: string, userType: string, email: string) => void;
  onResendInvite: (invitation: Invitation) => void;
  isResending: Record<string, boolean>;
  showShareLinks?: boolean;
}

export const PendingInvitationsTab: React.FC<PendingInvitationsTabProps> = ({
  invitations,
  isLoading,
  onCopyInvite,
  onShareInvite,
  onResendInvite,
  isResending,
  showShareLinks = true
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <InvitationTable
          invitations={invitations}
          isLoading={isLoading}
          emptyMessage="No pending invitations found"
          type="pending"
          onCopyInvite={onCopyInvite}
          onShareInvite={onShareInvite}
          onResendInvite={onResendInvite}
          isResending={isResending}
          showShareLinks={showShareLinks}
        />
      </CardContent>
    </Card>
  );
};
