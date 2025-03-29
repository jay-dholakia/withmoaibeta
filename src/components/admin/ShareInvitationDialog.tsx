
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Share2, Mail, Smartphone, Clipboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShareInvitationDialogProps {
  inviteLink: string;
  emailAddress: string;
  userType: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareInvitationDialog: React.FC<ShareInvitationDialogProps> = ({
  inviteLink,
  emailAddress,
  userType,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<string>('link');
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invitation link copied to clipboard');
  };

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userType.charAt(0).toUpperCase() + userType.slice(1)} Invitation`,
          text: `You are invited to join as a ${userType}. Click the link below to create your account.`,
          url: inviteLink
        });
        toast.success('Invitation shared successfully');
      } catch (error) {
        console.error('Error sharing:', error);
        toast.error('Failed to share invitation');
      }
    } else {
      copyToClipboard();
      toast.info('Share API not supported on this device. Link copied to clipboard instead.');
    }
  };

  const getEmailContent = () => {
    const subject = encodeURIComponent(`You've been invited to join as a ${userType}`);
    const body = encodeURIComponent(
      `Hello,\n\n` +
      `You've been invited to join as a ${userType}.\n\n` +
      `Click here to create your account: ${inviteLink}\n\n` +
      `This invitation link will expire in 30 days.`
    );
    return `mailto:${emailAddress}?subject=${subject}&body=${body}`;
  };

  const getSMSContent = () => {
    const message = encodeURIComponent(
      `You've been invited to join as a ${userType}. Create your account here: ${inviteLink}`
    );
    return `sms:${emailAddress}?body=${message}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            Share Invitation
          </DialogTitle>
          <DialogDescription>
            Share this invitation link with the user via your preferred method.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center space-x-2 mt-2">
              <Input 
                value={inviteLink} 
                readOnly 
                className="font-mono text-xs flex-1"
              />
              <Button onClick={copyToClipboard} size="icon" variant="outline">
                <Clipboard className="w-4 h-4" />
              </Button>
            </div>
            
            {navigator.share && (
              <Button 
                onClick={shareViaWebAPI} 
                className="w-full" 
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share via Device
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send an invitation email to <span className="font-medium">{emailAddress}</span>
            </p>
            <Button 
              onClick={() => window.location.href = getEmailContent()}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Open Email Client
            </Button>
          </TabsContent>
          
          <TabsContent value="sms" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send the invitation via SMS if you have the user's phone number
            </p>
            <Button 
              onClick={() => window.location.href = getSMSContent()}
              className="w-full"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Open SMS App
            </Button>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
