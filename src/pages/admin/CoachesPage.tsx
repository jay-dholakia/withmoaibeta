
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

interface CoachProfile {
  id: string;
  created_at: string;
  user_type: string;
  email?: string;
}

const CoachesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const navigate = useNavigate();
  const { userType: currentUserType } = useAuth();
  
  // Redirect if not admin
  React.useEffect(() => {
    if (currentUserType !== 'admin') {
      navigate('/admin');
    }
  }, [currentUserType, navigate]);

  // Query to fetch all coaches
  const { data: coaches, isLoading } = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      console.log('Fetching coaches...');
      
      // First get all coach profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'coach');
      
      if (profilesError) {
        console.error('Error fetching coach profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Coach profiles fetched:', profiles?.length || 0);
      
      if (!profiles || profiles.length === 0) {
        return [];
      }
      
      const userIds = profiles.map(profile => profile.id);
      
      // Try to get coach emails from RPC function
      try {
        const { data: emailsData, error: emailsError } = await supabase.rpc(
          'get_users_email',
          { user_ids: userIds }
        );
        
        if (emailsError) {
          throw emailsError;
        }
        
        console.log('Successfully fetched email data:', emailsData);
        
        // Check if emailsData is an array before using it
        if (emailsData && Array.isArray(emailsData)) {
          const coachesWithEmail = profiles.map(profile => {
            const emailRecord = emailsData.find((e: any) => e.id === profile.id);
            return {
              ...profile,
              email: emailRecord?.email || `${profile.id.split('-')[0]}@coach.com`
            };
          });
          
          console.log('Total coaches transformed:', coachesWithEmail.length);
          return coachesWithEmail as CoachProfile[];
        } else {
          console.error('Unexpected response format from get_users_email:', emailsData);
          throw new Error('Invalid response format from get_users_email');
        }
      } catch (emailError) {
        console.error('Error fetching coach emails:', emailError);
        // Fall back to formatted IDs
        return profiles.map(profile => ({
          ...profile,
          email: `${profile.id.split('-')[0]}@coach.com`
        })) as CoachProfile[];
      }
    },
    enabled: currentUserType === 'admin'
  });
  
  // Filter coaches based on search term
  const filteredCoaches = React.useMemo(() => {
    if (!coaches) return [];
    if (!searchTerm) return coaches;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return coaches.filter(coach => 
      coach.email?.toLowerCase().includes(lowerSearchTerm) ||
      coach.id.toLowerCase().includes(lowerSearchTerm)
    );
  }, [coaches, searchTerm]);

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
    <AdminDashboardLayout title="Manage Coaches">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coaches..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={() => navigate('/admin-dashboard/invitations')}
            className="bg-coach hover:bg-coach/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Coach
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
              ) : filteredCoaches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    {searchTerm ? 'No coaches found matching your search' : 'No coaches registered yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoaches.map((coach) => (
                  <TableRow key={coach.id}>
                    <TableCell className="font-medium">{coach.email}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {coach.id}
                    </TableCell>
                    <TableCell>{formatDate(coach.created_at)}</TableCell>
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

export default CoachesPage;
