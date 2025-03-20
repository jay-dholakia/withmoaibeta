
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InvitationTable, Invitation } from './InvitationTable';

interface AcceptedInvitationsTabProps {
  invitations: Invitation[];
  isLoading: boolean;
}

export const AcceptedInvitationsTab: React.FC<AcceptedInvitationsTabProps> = ({
  invitations,
  isLoading
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <InvitationTable
          invitations={invitations}
          isLoading={isLoading}
          emptyMessage="No accepted invitations found"
          type="accepted"
        />
      </CardContent>
    </Card>
  );
};
