
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
import { UserPlus, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  email: string;
  created_at: string;
  group_id?: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface GroupMembersDialogProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const GroupMembersDialog: React.FC<GroupMembersDialogProps> = ({
  group,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, group.id]);

  // Update available clients whenever clients or groupMembers change
  useEffect(() => {
    const groupMemberIds = groupMembers.map(member => member.id);
    
    // Fixed: Show all clients who aren't in THIS group (not just those without any group)
    const available = clients.filter(
      client => !groupMemberIds.includes(client.id)
    );
    
    console.log("All clients:", clients.length);
    console.log("Available clients for selection:", available.length);
    console.log("Current group members:", groupMemberIds.length);
    
    setAvailableClients(available);
    
    // Reset selection if selected client is no longer available
    if (selectedClient && !available.some(c => c.id === selectedClient)) {
      setSelectedClient('');
    }
  }, [clients, groupMembers]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all client profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          created_at,
          user_type,
          email:id (
            email
          )
        `)
        .eq('user_type', 'client');

      if (profilesError) {
        throw profilesError;
      }
      
      console.log("Profiles fetched:", profilesData?.length || 0);

      // Get all group members for all groups
      const { data: allGroupMembers, error: groupMembersError } = await supabase
        .from('group_members')
        .select('user_id, group_id');

      if (groupMembersError) {
        throw groupMembersError;
      }

      // Create a map of user_id to group_id
      const userGroupMap = allGroupMembers.reduce((map, item) => {
        map[item.user_id] = item.group_id;
        return map;
      }, {} as Record<string, string>);
      
      // Create client data from profiles
      const clientsData: Client[] = profilesData.map(profile => {
        return {
          id: profile.id,
          // Using profile ID as the email for display since we don't have access to auth.users
          email: `client_${profile.id.substring(0, 8)}`,
          created_at: profile.created_at,
          group_id: userGroupMap[profile.id] || null
        };
      });

      console.log("Total clients transformed:", clientsData.length);
      setClients(clientsData);

      // Get members of this specific group
      const groupMembersData = clientsData.filter(
        client => userGroupMap[client.id] === group.id
      );
      
      console.log("Members in this group:", groupMembersData.length);
      setGroupMembers(groupMembersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load client data. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedClient) {
      toast.error('Please select a client to add');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert([
          { group_id: group.id, user_id: selectedClient }
        ]);

      if (error) {
        throw error;
      }

      toast.success('Client added to group successfully');
      
      // Update UI state
      const addedClient = clients.find(c => c.id === selectedClient);
      if (addedClient) {
        const updatedClient = { ...addedClient, group_id: group.id };
        setGroupMembers(prev => [...prev, updatedClient]);
        
        // Update the client in the clients list
        setClients(prev => 
          prev.map(c => c.id === selectedClient ? updatedClient : c)
        );
      }
      
      setSelectedClient('');
      
      // Notify parent of success
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding client to group:', error);
      toast.error('Failed to add client to group');
    }
  };

  const handleRemoveMember = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', clientId);

      if (error) {
        throw error;
      }

      toast.success('Client removed from group successfully');
      
      // Update UI state
      setGroupMembers(prev => prev.filter(member => member.id !== clientId));
      
      // Update the client in the clients list
      setClients(prev => 
        prev.map(c => c.id === clientId ? { ...c, group_id: null } : c)
      );
      
      // Notify parent of success
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error removing client from group:', error);
      toast.error('Failed to remove client from group');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Members for {group.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add new member */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Add Client to Group</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData} 
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
            
            <div className="flex gap-2">
              <Select
                value={selectedClient}
                onValueChange={setSelectedClient}
              >
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.length > 0 ? (
                    availableClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available clients
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={!selectedClient || isLoading}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add to Group
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Note: Only clients who are not already in this group are shown.
            </p>
          </div>
          
          <Separator />
          
          {/* Current members */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Group Members</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
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
                ) : groupMembers.length > 0 ? (
                  groupMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      No clients in this group yet.
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

export default GroupMembersDialog;
