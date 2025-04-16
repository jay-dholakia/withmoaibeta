
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, UserPlus, Edit, Trash, Shuffle } from 'lucide-react';
import GroupCoachesDialog from './GroupCoachesDialog';
import GroupMembersDialog from './GroupMembersDialog';
import EditGroupDialog from './EditGroupDialog';
import { generateWeeklyBuddies } from '@/services/accountability-buddy-service';

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  _count?: {
    members: number;
    coaches: number;
  };
}

const fetchGroups = async (): Promise<Group[]> => {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  const enhancedGroups = await Promise.all(
    groups.map(async (group) => {
      const { count: coachCount, error: coachError } = await supabase
        .from('group_coaches')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);
      
      const { count: memberCount, error: memberError } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);
      
      if (coachError || memberError) {
        console.error('Error fetching counts:', coachError || memberError);
      }

      return {
        ...group,
        _count: {
          coaches: coachCount || 0,
          members: memberCount || 0
        }
      };
    })
  );

  return enhancedGroups;
};

const GroupList: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isCoachDialogOpen, setIsCoachDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGeneratingBuddies, setIsGeneratingBuddies] = useState<Record<string, boolean>>({});

  const { data: groups, isLoading, error, refetch } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load groups');
      console.error('Error fetching groups:', error);
    }
  }, [error]);

  const handleManageCoaches = (group: Group) => {
    setSelectedGroup(group);
    setIsCoachDialogOpen(true);
  };

  const handleManageMembers = (group: Group) => {
    setSelectedGroup(group);
    setIsMemberDialogOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setIsEditDialogOpen(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? All coach and client assignments will be removed.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Group deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleGenerateAccountabilityBuddies = async (groupId: string) => {
    try {
      setIsGeneratingBuddies(prev => ({ ...prev, [groupId]: true }));
      
      // First check if the group has enough members
      const { count: memberCount, error: countError } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);
        
      if (countError) {
        throw countError;
      }
      
      if (!memberCount || memberCount < 2) {
        toast.error('Group needs at least 2 members to generate accountability buddies');
        return;
      }
      
      // Generate buddies with upsert approach to handle conflicts
      const result = await generateWeeklyBuddies(groupId, true);
      
      if (result) {
        toast.success('Accountability buddies generated successfully for this group');
      } else {
        toast.error('Failed to generate accountability buddies');
      }
    } catch (error: any) {
      console.error('Error generating accountability buddies:', error);
      
      if (error.code === '23505' || error.message?.includes('duplicate key value')) {
        toast.error('Accountability buddies already exist for this week. They have been updated.');
      } else {
        toast.error('An error occurred while generating accountability buddies');
      }
    } finally {
      setIsGeneratingBuddies(prev => ({ ...prev, [groupId]: false }));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading groups...</div>;
  }

  return (
    <div>
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Coaches</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups && groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description || 'No description'}</TableCell>
                    <TableCell className="text-center">{group._count?.coaches || 0}</TableCell>
                    <TableCell className="text-center">{group._count?.members || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageCoaches(group)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Coaches
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageMembers(group)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Members
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateAccountabilityBuddies(group.id)}
                          disabled={isGeneratingBuddies[group.id]}
                        >
                          <Shuffle className={`h-4 w-4 mr-1 ${isGeneratingBuddies[group.id] ? 'animate-spin' : ''}`} />
                          {isGeneratingBuddies[group.id] ? 'Generating...' : 'Generate Buddies'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No groups found. Create a new group to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedGroup && (
        <>
          <EditGroupDialog
            group={selectedGroup}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => refetch()}
          />
          
          <GroupCoachesDialog 
            group={selectedGroup}
            open={isCoachDialogOpen}
            onOpenChange={setIsCoachDialogOpen}
            onSuccess={() => refetch()}
          />
          
          <GroupMembersDialog
            group={selectedGroup}
            open={isMemberDialogOpen}
            onOpenChange={setIsMemberDialogOpen}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </div>
  );
};

export default GroupList;
