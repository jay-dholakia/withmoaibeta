import React, { useEffect, useState } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Trash2, KeyRound } from 'lucide-react';
import { deleteUser, sendPasswordResetEmail } from '@/services/client-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Client {
  id: string;
  email: string;
  created_at: string;
  group_name: string | null;
}

const fetchClients = async (): Promise<Client[]> => {
  console.log('Fetching clients for admin panel');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      created_at,
      user_type
    `)
    .eq('user_type', 'client')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }

  console.log('Fetched profiles:', profiles);

  const { data: groupMembers, error: groupMembersError } = await supabase
    .from('group_members')
    .select('user_id, group_id');

  if (groupMembersError) {
    console.error('Error fetching group members:', groupMembersError);
    throw groupMembersError;
  }

  const userGroupMap = groupMembers?.reduce((map, item) => {
    map[item.user_id] = item.group_id;
    return map;
  }, {} as Record<string, string>) || {};

  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name');

  if (groupsError) {
    console.error('Error fetching groups:', groupsError);
    throw groupsError;
  }

  const groupNameMap = groups?.reduce((map, group) => {
    map[group.id] = group.name;
    return map;
  }, {} as Record<string, string>) || {};

  const { data: emailsData, error: emailsError } = await supabase.rpc('get_users_email', {
    user_ids: profiles?.map(p => p.id) || []
  });

  if (emailsError) {
    console.error('Error fetching user emails:', emailsError);
    throw emailsError;
  }

  console.log('Fetched emails:', emailsData);

  const emailMap = emailsData?.reduce((map, item) => {
    map[item.id] = item.email;
    return map;
  }, {} as Record<string, string>) || {};

  const clientsData: Client[] = profiles?.map(profile => {
    return {
      id: profile.id,
      email: emailMap[profile.id] || 'Unknown email',
      created_at: profile.created_at,
      group_name: userGroupMap[profile.id] ? groupNameMap[userGroupMap[profile.id]] || null : null
    };
  }) || [];

  console.log('Final client data:', clientsData);
  return clientsData;
};

const ClientsPage: React.FC = () => {
  const { userType } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  useEffect(() => {
    if (userType !== 'admin') {
      navigate('/admin');
    }
  }, [userType, navigate]);

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: fetchClients,
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    }
  }, [error]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteUser(clientToDelete.id);
      
      if (!success) {
        throw new Error('Failed to delete user');
      }
      
      toast.success(`User ${clientToDelete.email} was deleted successfully`);
      refetch();
    } catch (err) {
      console.error('Error in delete process:', err);
      toast.error('An error occurred while deleting the user');
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  const handleResetPassword = async (client: Client) => {
    setIsResettingPassword(true);
    try {
      const success = await sendPasswordResetEmail(client.email);
      
      if (!success) {
        throw new Error('Failed to send password reset email');
      }
      
      toast.success(`Password reset email sent to ${client.email}`);
    } catch (err) {
      console.error('Error in password reset process:', err);
      toast.error('An error occurred while sending the password reset email');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const sortedClients = React.useMemo(() => {
    if (!clients) return [];
    
    return [...clients].sort((a, b) => {
      if (!a.group_name && b.group_name) return -1;
      if (a.group_name && !b.group_name) return 1;
      
      return a.email.localeCompare(b.email);
    });
  }, [clients]);

  if (userType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Clients">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-muted-foreground text-sm">
            Manage client accounts and group assignments
          </h2>
        </div>
        <div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isRefreshing ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                      Loading clients...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedClients && sortedClients.length > 0 ? (
                sortedClients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      {client.group_name || 'Not assigned to any group'}
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleResetPassword(client)}
                          disabled={isResettingPassword}
                          title="Reset password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setClientToDelete(client)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user account for{' '}
              <span className="font-semibold">{clientToDelete?.email}</span>?
              <br /><br />
              This action is <span className="text-destructive font-semibold">permanent</span> and cannot be undone.
              The user will need to sign up again to create a new account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteClient();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminDashboardLayout>
  );
};

export default ClientsPage;
