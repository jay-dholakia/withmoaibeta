
import React, { useState } from 'react';
import { ShareInvitationDialog } from './ShareInvitationDialog';

interface ShareInvitationDialogContainerProps {
  onShareInvite: (token: string, userType: string, email: string) => void;
}

export const ShareInvitationDialogContainer: React.FC<ShareInvitationDialogContainerProps> = ({ onShareInvite }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareInfo, setShareInfo] = useState<{
    link: string;
    email: string;
    userType: string;
  }>({ link: '', email: '', userType: '' });

  const handleShareInvite = (token: string, userType: string, email: string) => {
    const link = `${window.location.origin}/register?token=${token}&type=${userType}`;
    
    setShareInfo({
      link,
      email,
      userType
    });
    
    setShareDialogOpen(true);
  };
  
  return (
    <>
      <ShareInvitationDialog 
        inviteLink={shareInfo.link}
        emailAddress={shareInfo.email}
        userType={shareInfo.userType}
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
      {onShareInvite(shareInfo.link, shareInfo.userType, shareInfo.email)}
    </>
  );
};
