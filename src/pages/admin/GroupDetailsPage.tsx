
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Users, ArrowLeft } from 'lucide-react';
import GroupCoachesDialog from '@/components/admin/GroupCoachesDialog';
import GroupMembersDialog from '@/components/admin/GroupMembersDialog';
import { useAuth } from '@/contexts/AuthContext';

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
}

interface Coach {
  id: string;
  email: string;
}

interface Client {
  id: string;
  email: string;
}

const GroupDetailsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isCoachDialogOpen, setIsCoachDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { userType } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (userType !== 'admin') {
      navigate('/admin');
    }
  }, [userType, navigate]);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const fetchGroupDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) {
        throw groupError;
      }

      setGroup(groupData);

      // Fetch coaches for this group
      await fetchGroupCoaches();

      // Fetch clients for this group
      await fetchGroupClients();
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast.error('Failed to load group details');
      navigate('/admin-dashboard/groups');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('group_coaches')
        .select('coach_id')
        .eq('group_id', groupId);

      if (error) {
        throw error;
      }

      const coachIds = data.map(item => item.coach_id);
      
      if (coachIds.length === 0) {
        setCoaches([]);
        return;
      }
      
      // Fetch coach profiles from the profiles table
      const { data: coachProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .in('id', coachIds)
        .eq('user_type', 'coach');
        
      if (profilesError) {
        throw profilesError;
      }
      
      // Create coach data with formatted emails since we can't directly access auth.users
      const coachesData: Coach[] = coachProfiles.map(coach => ({
        id: coach.id,
        email: `${coach.id.split('-')[0]}@coach.com` // Simplified display for coaches
      }));
      
      setCoaches(coachesData);
    } catch (error) {
      console.error('Error fetching group coaches:', error);
      toast.error('Failed to load coaches');
    }
  };

  const fetchGroupClients = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (error) {
        throw error;
      }

      const clientIds = data.map(item => item.user_id);
      
      if (clientIds.length === 0) {
        setClients([]);
        return;
      }
      
      // Fetch client profiles from the profiles table
      const { data: clientProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .in('id', clientIds)
        .eq('user_type', 'client');
        
      if (profilesError) {
        throw profilesError;
      }
      
      // Create client data with formatted emails since we can't directly access auth.users
      const clientsData: Client[] = clientProfiles.map(client => ({
        id: client.id,
        email: `${client.id.split('-')[0]}@client.com` // Simplified display for clients
      }));
      
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching group clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const handleRefresh = () => {
    fetchGroupDetails();
  };

  if (userType !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <AdminDashboardLayout title="Group Details">
        <div className="flex justify-center p-8">Loading group details...</div>
      </AdminDashboardLayout>
    );
  }

  if (!group) {
    return (
      <AdminDashboardLayout title="Group Details">
        <div className="flex flex-col items-center p-8">
          <p className="text-lg mb-4">Group not found</p>
          <Button onClick={() => navigate('/admin-dashboard/groups')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Button>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout title={`Group: ${group.name}`}>
      <div className="mb-6 flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin-dashboard/groups')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>
        
        <div className="flex gap-2">
          <Button onClick={() => setIsCoachDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Manage Coaches
          </Button>
          <Button onClick={() => setIsMemberDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Manage Members
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p>{group.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p>{group.description || 'No description'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p>{new Date(group.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="coaches">
        <TabsList>
          <TabsTrigger value="coaches">Coaches ({coaches.length})</TabsTrigger>
          <TabsTrigger value="members">Members ({clients.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="coaches" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coaches.length > 0 ? (
                    coaches.map(coach => (
                      <TableRow key={coach.id}>
                        <TableCell>{coach.email}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-center py-8">
                        No coaches assigned to this group yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length > 0 ? (
                    clients.map(client => (
                      <TableRow key={client.id}>
                        <TableCell>{client.email}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-center py-8">
                        No clients in this group yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {group && (
        <>
          <GroupCoachesDialog 
            group={group}
            open={isCoachDialogOpen}
            onOpenChange={setIsCoachDialogOpen}
            onSuccess={handleRefresh}
          />
          
          <GroupMembersDialog
            group={group}
            open={isMemberDialogOpen}
            onOpenChange={setIsMemberDialogOpen}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </AdminDashboardLayout>
  );
};

export default GroupDetailsPage;
