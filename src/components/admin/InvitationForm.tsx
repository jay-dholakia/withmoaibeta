
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationFormProps {
  onInvite: (email: string, userType: 'client' | 'coach' | 'admin') => void;
  isLoading: boolean;
}

export const InvitationForm: React.FC<InvitationFormProps> = ({
  onInvite,
  isLoading
}) => {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'client' | 'coach' | 'admin'>('client');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Invitation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send New Invitation</DialogTitle>
          <DialogDescription>
            Invite a new user to create a client, coach or admin account.
            <p className="mt-2 text-amber-500 text-xs">
              Note: If the email service is unavailable, you'll be provided with a link to share manually.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
            <div className="flex space-x-4">
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
              Create Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
