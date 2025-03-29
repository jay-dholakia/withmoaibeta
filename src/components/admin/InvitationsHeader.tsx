
import React from 'react';
import { InvitationForm } from './InvitationForm';
import { ShareableLinkDialog } from './ShareableLinkDialog';
import { InvitationLinkDialog } from './InvitationLinkDialog';

interface InvitationsHeaderProps {
  onInvite: (email: string, userType: 'client' | 'coach' | 'admin') => Promise<any>;
  onCreateShareableLink: (userType: 'client' | 'coach' | 'admin') => void;
  isInviteLoading: boolean;
  isShareLinkLoading: boolean;
  inviteLink: string;
}

export const InvitationsHeader: React.FC<InvitationsHeaderProps> = ({
  onInvite,
  onCreateShareableLink,
  isInviteLoading,
  isShareLinkLoading,
  inviteLink
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Invitations</h2>
      
      <div className="flex space-x-2">
        <InvitationForm 
          onInvite={onInvite} 
          isLoading={isInviteLoading} 
        />
        
        <ShareableLinkDialog
          onCreateShareableLink={onCreateShareableLink}
          isLoading={isShareLinkLoading}
        />
        
        {inviteLink && <InvitationLinkDialog inviteLink={inviteLink} />}
      </div>
    </div>
  );
};
