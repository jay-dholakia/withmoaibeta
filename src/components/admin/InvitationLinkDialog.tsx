
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationLinkDialogProps {
  inviteLink: string;
}

export const InvitationLinkDialog: React.FC<InvitationLinkDialogProps> = ({
  inviteLink
}) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invitation link copied to clipboard');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy className="w-4 h-4 mr-2" />
          Copy Last Invite Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitation Link</DialogTitle>
          <DialogDescription>
            Share this link with the invited user.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <Input value={inviteLink} readOnly />
          <Button onClick={copyToClipboard} size="sm">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
