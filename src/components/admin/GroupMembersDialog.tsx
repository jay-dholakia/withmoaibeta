
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

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, group.id]);

  // Update available clients whenever clients or groupMembers change
  useEffect(() => {
    const groupMemberIds = groupMembers.map(member => member.id);
    const available = clients.filter(
      client => !groupMemberIds.includes(client.id) && !client.group_id
    );
    setAvailableClients(available);
    
    // Reset selection if selected client is no longer available
    if (selectedClient && !available.some(c => c.id === selectedClient)) {
      setSelectedClient('');
    }
  }, [clients, groupMembers]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get all client profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          created_at,
          auth_users:id(email)
        `)
        .eq('user_type', 'client')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

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

      // Transform profile data and add group_id if available
      const clientsData = profilesData.map(profile => ({
        id: profile.id,
        email: profile.auth_users?.email || 'Unknown email',
        created_at: profile.created_at,
        group_id: userGroupMap[profile.id] || null
      }));

      setClients(clientsData);

      // Get members of this specific group
      const groupMembersData = clientsData.filter(
        client => userGroupMap[client.id] === group.id
      );
      setGroupMembers(groupMembersData);
    } catch (error) {
      console.error('Error fetching data:', error);
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
            <h3 className="text-lg font-medium">Add Client to Group</h3>
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
              <Button onClick={handleAddMember} disabled={!selectedClient}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add to Group
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Note: Only clients who are not already assigned to any group are shown.
            </p>
          </div>
          
          <Separator />
          
          {/* Current members */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Group Members</h3>
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
