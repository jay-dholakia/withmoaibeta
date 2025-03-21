
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Copy, Mail, AlertTriangle } from 'lucide-react';
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
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Manual Invitation Sharing Required
          </DialogTitle>
          <DialogDescription className="text-amber-500">
            Email service is currently unavailable. You need to share this invitation link manually.
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
          
          <div className="bg-muted p-4 rounded-md text-sm border border-amber-200">
            <p className="font-medium mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Instructions for manual sharing:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Copy the invitation link above</li>
              <li>Send it to <strong>{inviteLink.includes('token=') ? inviteLink.split('token=')[1].split('&')[0].substring(0, 8) + '...' : 'the user'}</strong> via email or messaging</li>
              <li>Let them know this link will give them access to create their account</li>
              <li>The link will expire in 30 days</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-amber-200">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> To enable automatic email sending, 
                the Resend API key needs to be configured in your Supabase project.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
