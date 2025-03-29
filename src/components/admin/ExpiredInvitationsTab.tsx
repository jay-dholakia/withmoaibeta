
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InvitationTable, Invitation } from './InvitationTable';

interface ExpiredInvitationsTabProps {
  invitations: Invitation[];
  isLoading: boolean;
  onResendInvite: (invitation: Invitation) => void;
  isResending: Record<string, boolean>;
}

export const ExpiredInvitationsTab: React.FC<ExpiredInvitationsTabProps> = ({
  invitations,
  isLoading,
  onResendInvite,
  isResending
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <InvitationTable
          invitations={invitations}
          isLoading={isLoading}
          emptyMessage="No expired invitations found"
          type="expired"
          onResendInvite={onResendInvite}
          isResending={isResending}
        />
      </CardContent>
    </Card>
  );
};
