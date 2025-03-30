
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  DialogClose 
} from '@/components/ui/dialog';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { Plus, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationFormProps {
  onInvite: (email: string, userType: 'client' | 'coach' | 'admin') => void;
  onCreateShareLink: (userType: 'client' | 'coach' | 'admin') => void;
  isLoading: boolean;
}

export const InvitationForm: React.FC<InvitationFormProps> = ({
  onInvite,
  onCreateShareLink,
  isLoading
}) => {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'client' | 'coach' | 'admin'>('client');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'sharelink'>('email');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log(`Submitting invitation for ${email} with type ${userType}`);
      await onInvite(email, userType);
      setEmail('');
      setIsDialogOpen(false);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting invitation:', error);
      setIsSubmitting(false);
      
      if (error instanceof Error) {
        toast.error(`Failed to create invitation: ${error.message}`);
      } else {
        toast.error('Failed to create invitation. Please try again.');
      }
    }
  };

  const handleShareLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      console.log(`Creating share link for ${userType}`);
      await onCreateShareLink(userType);
      setIsDialogOpen(false);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error creating share link:', error);
      setIsSubmitting(false);
      
      if (error instanceof Error) {
        toast.error(`Failed to create share link: ${error.message}`);
      } else {
        toast.error('Failed to create share link. Please try again.');
      }
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Invitation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Invitation</DialogTitle>
          <DialogDescription>
            Invite users to create an account or generate a shareable registration link.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="email" 
          className="mt-4"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'email' | 'sharelink')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email Invitation</TabsTrigger>
            <TabsTrigger value="sharelink">Shareable Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4 mt-4">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="userType" className="text-sm font-medium">
                  Account Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={userType === 'client' ? 'default' : 'outline'}
                    onClick={() => setUserType('client')}
                    className={userType === 'client' ? 'bg-client text-white' : ''}
                  >
                    Client
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'coach' ? 'default' : 'outline'}
                    onClick={() => setUserType('coach')}
                    className={userType === 'coach' ? 'bg-coach text-white' : ''}
                  >
                    Coach
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'admin' ? 'default' : 'outline'}
                    onClick={() => setUserType('admin')}
                    className={userType === 'admin' ? 'bg-blue-500 text-white' : ''}
                  >
                    Admin
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading || isSubmitting}
                  className={
                    userType === 'client' ? 'bg-client hover:bg-client/90' : 
                    userType === 'coach' ? 'bg-coach hover:bg-coach/90' : 
                    'bg-blue-500 hover:bg-blue-600'
                  }
                >
                  {(isLoading || isSubmitting) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Email Invitation
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="sharelink" className="space-y-4 mt-4">
            <form onSubmit={handleShareLinkSubmit} className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <p className="text-sm text-amber-800">
                  This will create a shareable registration link that anyone can use to create an account.
                  The link will expire in 30 days. Anyone with this link can register without needing a specific email invitation.
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="shareUserType" className="text-sm font-medium">
                  Account Type for Share Link
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={userType === 'client' ? 'default' : 'outline'}
                    onClick={() => setUserType('client')}
                    className={userType === 'client' ? 'bg-client text-white' : ''}
                  >
                    Client
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'coach' ? 'default' : 'outline'}
                    onClick={() => setUserType('coach')}
                    className={userType === 'coach' ? 'bg-coach text-white' : ''}
                  >
                    Coach
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'admin' ? 'default' : 'outline'}
                    onClick={() => setUserType('admin')}
                    className={userType === 'admin' ? 'bg-blue-500 text-white' : ''}
                  >
                    Admin
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading || isSubmitting}
                  className={
                    userType === 'client' ? 'bg-client hover:bg-client/90' : 
                    userType === 'coach' ? 'bg-coach hover:bg-coach/90' : 
                    'bg-blue-500 hover:bg-blue-600'
                  }
                >
                  {(isLoading || isSubmitting) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Generate Shareable Link
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
