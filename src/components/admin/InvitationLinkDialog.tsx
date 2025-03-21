
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
          Share Invitation Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitation Link</DialogTitle>
          <DialogDescription>
            Email sending failed. Share this link directly with the invited user.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-center space-x-2">
            <Input 
              value={inviteLink} 
              readOnly 
              className="font-mono text-xs"
            />
            <Button onClick={copyToClipboard} size="sm">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-2">Instructions for sharing:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Copy the link above</li>
              <li>Send it to the user via your preferred messaging app</li>
              <li>Inform them that this link will allow them to create their account</li>
              <li>The link will expire in 30 days</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
