
import React from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Plus, Loader2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ClientProfile {
  id: string;
  created_at: string;
  user_type: string;
  email?: string;
}

const ClientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const navigate = useNavigate();
  const { userType: currentUserType } = useAuth();
  
  // Redirect if not admin
  React.useEffect(() => {
    if (currentUserType !== 'admin') {
      navigate('/admin');
    }
  }, [currentUserType, navigate]);

  // Query to fetch all clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // First get all client profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'client');
      
      if (profilesError) throw profilesError;
      
      // Then get the user emails (in a real app, we'd use joins or RPC, but for simplicity we'll do it this way)
      const clientsWithEmail = await Promise.all(
        profiles.map(async (profile) => {
          const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(profile.id);
          
          if (userError || !authUser) {
            console.error('Error fetching user details:', userError);
            return { ...profile, email: 'Unknown' };
          }
          
          return { ...profile, email: authUser.user.email };
        })
      );
      
      return clientsWithEmail as ClientProfile[];
    },
    enabled: currentUserType === 'admin'
  });
  
  // Filter clients based on search term
  const filteredClients = React.useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.email?.toLowerCase().includes(lowerSearchTerm) ||
      client.id.toLowerCase().includes(lowerSearchTerm)
    );
  }, [clients, searchTerm]);

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (currentUserType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Manage Clients">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={() => navigate('/admin-dashboard/invitations')}
            className="bg-client hover:bg-client/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Client
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    {searchTerm ? 'No clients found matching your search' : 'No clients registered yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.email}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {client.id}
                    </TableCell>
                    <TableCell>{formatDate(client.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default ClientsPage;
