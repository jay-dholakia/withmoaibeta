
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
  onInvite: (email: string, userType: 'client' | 'coach') => void;
  isLoading: boolean;
}

export const InvitationForm: React.FC<InvitationFormProps> = ({
  onInvite,
  isLoading
}) => {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'client' | 'coach'>('client');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    onInvite(email, userType);
    setIsDialogOpen(false);
    setEmail('');
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
            Invite a new user to create a client or coach account.
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
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading}
              className={userType === 'client' ? 'bg-client hover:bg-client/90' : 'bg-coach hover:bg-coach/90'}
            >
              {isLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
