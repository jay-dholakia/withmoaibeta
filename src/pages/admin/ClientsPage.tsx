
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

interface Client {
  id: string;
  email: string;
  created_at: string;
  group_name: string | null;
}

const fetchClients = async (): Promise<Client[]> => {
  // Fetch client profiles
  const { data: profiles, error: profilesError } = await supabase
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

  // Get all group memberships
  const { data: groupMembers, error: groupMembersError } = await supabase
    .from('group_members')
    .select('user_id, group_id');

  if (groupMembersError) {
    throw groupMembersError;
  }

  // Create a map of user_id to group_id
  const userGroupMap = groupMembers.reduce((map, item) => {
    map[item.user_id] = item.group_id;
    return map;
  }, {} as Record<string, string>);

  // Get all group names
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name');

  if (groupsError) {
    throw groupsError;
  }

  // Create a map of group_id to group_name
  const groupNameMap = groups.reduce((map, group) => {
    map[group.id] = group.name;
    return map;
  }, {} as Record<string, string>);

  // Transform profile data and add group info
  return profiles.map(profile => ({
    id: profile.id,
    email: profile.auth_users?.email || 'Unknown email',
    created_at: profile.created_at,
    group_name: userGroupMap[profile.id] ? groupNameMap[userGroupMap[profile.id]] || null : null
  }));
};

const ClientsPage: React.FC = () => {
  const { userType } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not admin
  useEffect(() => {
    if (userType !== 'admin') {
      navigate('/admin');
    }
  }, [userType, navigate]);

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    }
  }, [error]);

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
          <Button variant="outline" onClick={() => refetch()}>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Loading clients...
                  </TableCell>
                </TableRow>
              ) : clients && clients.length > 0 ? (
                clients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      {client.group_name || 'Not assigned to any group'}
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminDashboardLayout>
  );
};

export default ClientsPage;
