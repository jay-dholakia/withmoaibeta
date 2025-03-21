
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { UserPlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Coach {
  id: string;
  email: string;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
}

interface GroupCoachesDialogProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const GroupCoachesDialog: React.FC<GroupCoachesDialogProps> = ({
  group,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [assignedCoaches, setAssignedCoaches] = useState<string[]>([]);
  const [availableCoaches, setAvailableCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch coaches and assigned coaches when dialog opens
  useEffect(() => {
    if (open) {
      fetchCoaches();
      fetchAssignedCoaches();
    }
  }, [open, group.id]);

  // Update available coaches whenever coaches or assignedCoaches change
  useEffect(() => {
    const available = coaches.filter(
      coach => !assignedCoaches.includes(coach.id)
    );
    setAvailableCoaches(available);
    
    // Reset selection if selected coach is no longer available
    if (selectedCoach && !available.some(c => c.id === selectedCoach)) {
      setSelectedCoach('');
    }
  }, [coaches, assignedCoaches]);

  const fetchCoaches = async () => {
    setIsLoading(true);
    try {
      // Get all users with coach role from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          created_at,
          user_type
        `)
        .eq('user_type', 'coach');

      if (profilesError) {
        throw profilesError;
      }

      // Fetch user emails separately
      const userIds = profilesData.map(profile => profile.id);
      
      // Get user emails from auth.users via getUser (can't query auth.users directly)
      const coachesData: Coach[] = [];
      
      for (const profileId of userIds) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileId);
        
        if (!userError && userData?.user) {
          coachesData.push({
            id: profileId,
            email: userData.user.email || 'Unknown email',
            created_at: profilesData.find(p => p.id === profileId)?.created_at || new Date().toISOString()
          });
        }
      }

      setCoaches(coachesData);
    } catch (error) {
      console.error('Error fetching coaches:', error);
      toast.error('Failed to load coaches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('group_coaches')
        .select('coach_id')
        .eq('group_id', group.id);

      if (error) {
        throw error;
      }
      
      setAssignedCoaches(data.map(item => item.coach_id));
    } catch (error) {
      console.error('Error fetching assigned coaches:', error);
      toast.error('Failed to load assigned coaches');
    }
  };

  const handleAssignCoach = async () => {
    if (!selectedCoach) {
      toast.error('Please select a coach to assign');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_coaches')
        .insert([
          { group_id: group.id, coach_id: selectedCoach }
        ]);

      if (error) {
        throw error;
      }

      toast.success('Coach assigned to group successfully');
      
      // Update assigned coaches
      setAssignedCoaches(prev => [...prev, selectedCoach]);
      setSelectedCoach('');
      
      // Notify parent of success
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error assigning coach to group:', error);
      toast.error('Failed to assign coach to group');
    }
  };

  const handleRemoveCoach = async (coachId: string) => {
    try {
      const { error } = await supabase
        .from('group_coaches')
        .delete()
        .eq('group_id', group.id)
        .eq('coach_id', coachId);

      if (error) {
        throw error;
      }

      toast.success('Coach removed from group successfully');
      
      // Update assigned coaches
      setAssignedCoaches(prev => prev.filter(id => id !== coachId));
      
      // Notify parent of success
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error removing coach from group:', error);
      toast.error('Failed to remove coach from group');
    }
  };

  // Get assigned coach details
  const getAssignedCoachDetails = () => {
    return coaches.filter(coach => assignedCoaches.includes(coach.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Coaches for {group.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Assign new coach */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assign Coach to Group</h3>
            <div className="flex gap-2">
              <Select
                value={selectedCoach}
                onValueChange={setSelectedCoach}
              >
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Select a coach" />
                </SelectTrigger>
                <SelectContent>
                  {availableCoaches.length > 0 ? (
                    availableCoaches.map(coach => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available coaches
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAssignCoach} disabled={!selectedCoach}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Coach
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Currently assigned coaches */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Currently Assigned Coaches</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : getAssignedCoachDetails().length > 0 ? (
                  getAssignedCoachDetails().map(coach => (
                    <TableRow key={coach.id}>
                      <TableCell>{coach.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCoach(coach.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      No coaches assigned to this group yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupCoachesDialog;
