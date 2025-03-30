
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Copy, Mail, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationLinkDialogProps {
  inviteLink: string;
  isShareLink?: boolean;
}

export const InvitationLinkDialog: React.FC<InvitationLinkDialogProps> = ({
  inviteLink,
  isShareLink = false
}) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invitation link copied to clipboard');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          {isShareLink ? (
            <LinkIcon className="w-4 h-4 mr-2" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {isShareLink ? 'Share Registration Link' : 'Share Invitation Link'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isShareLink ? (
              <>
                <LinkIcon className="w-5 h-5 text-blue-500" />
                Shareable Registration Link
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Manual Invitation Sharing Required
              </>
            )}
          </DialogTitle>
          <DialogDescription className={isShareLink ? "text-blue-500" : "text-amber-500"}>
            {isShareLink 
              ? "Anyone with this link can register an account. No email is required in advance."
              : "Email service is currently unavailable. You need to share this invitation link manually."}
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
          
          <div className={`bg-muted p-4 rounded-md text-sm border ${isShareLink ? 'border-blue-200' : 'border-amber-200'}`}>
            <p className="font-medium mb-2 flex items-center gap-2">
              {isShareLink ? (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Instructions for sharing:
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Instructions for manual sharing:
                </>
              )}
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Copy the {isShareLink ? 'registration' : 'invitation'} link above</li>
              <li>
                {isShareLink 
                  ? 'Share it with anyone who needs to create a new account'
                  : `Send it to the user via email or messaging`}
              </li>
              <li>
                {isShareLink
                  ? 'Users who open the link will be able to register by providing their email'
                  : 'Let them know this link will give them access to create their account'}
              </li>
              <li>The link will expire in 30 days</li>
            </ol>
            {!isShareLink && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> To enable automatic email sending, 
                  the Resend API key needs to be configured in your Supabase project.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
