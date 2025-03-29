
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Users, Copy, Link } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShareableLinkDialogProps {
  onCreateShareableLink: (userType: 'client' | 'coach' | 'admin') => void;
  isLoading: boolean;
}

export const ShareableLinkDialog: React.FC<ShareableLinkDialogProps> = ({
  onCreateShareableLink,
  isLoading
}) => {
  const [userType, setUserType] = useState<'client' | 'coach' | 'admin'>('client');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateShareableLink(userType);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link className="w-4 h-4 mr-2" />
          Create Shareable Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Create Shareable Invitation Link
          </DialogTitle>
          <DialogDescription>
            Generate a link that can be shared with anyone. They will be prompted to enter their email when they access the link.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
              disabled={isLoading}
              className={
                userType === 'client' ? 'bg-client hover:bg-client/90' : 
                userType === 'coach' ? 'bg-coach hover:bg-coach/90' : 
                'bg-blue-500 hover:bg-blue-600'
              }
            >
              Create Shareable Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
