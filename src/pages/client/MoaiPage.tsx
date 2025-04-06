
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mountain, Users, UserRound, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import MoaiMembersTab from '@/components/client/MoaiMembersTab';
import MoaiGroupProgress from '@/components/client/MoaiGroupProgress';
import { 
  fetchUserGroups, 
  diagnoseGroupAccess, 
  verifyUserGroupMembership
} from '@/services/moai-service';
import { supabase } from '@/integrations/supabase/client';

// Define a type for the group to avoid TypeScript errors
interface Group {
  id: string;
  name: string;
  description: string | null;
  spotify_playlist_url?: string | null;
}

const MoaiPage = () => {
  const { user } = useAuth();
  const [diagnosticDetails, setDiagnosticDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { data: userGroups, isLoading: isLoadingGroups, refetch } = useQuery({
    queryKey: ['client-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for group fetch');
        return [];
      }
      
      console.log('Fetching groups for user ID:', user.id);
      try {
        const { data: membershipData, error: membershipError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);
          
        if (membershipError) {
          console.error('Direct membership check error:', membershipError);
        } else {
          console.log('Direct membership check result:', membershipData);
        }
        
        const groups = await fetchUserGroups(user.id);
        return groups as Group[] || []; // Cast to Group[] to ensure TypeScript knows the shape
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to fetch your groups. Please try again later.');
        return [];
      }
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, 
    gcTime: 10000,
  });
  
  useEffect(() => {
    let isMounted = true;
    
    const checkUserAndGroups = async () => {
      if (!user?.id) return;
      
      try {
        const userExists = await verifyUserExistsInAuth(user.id);
        if (!userExists) {
          console.log('User verification failed, skipping group access diagnosis');
          return;
        }
        
        const result = await diagnoseGroupAccess(user.id);
        console.log('Group access diagnosis result:', result);
        
        if (isMounted) {
          setDiagnosticDetails(result);
          
          if (result && result.hasGroupMemberships && 
              (!userGroups || userGroups.length === 0)) {
            refetch();
          }
        }
      } catch (error) {
        console.error('Error during group access diagnosis:', error);
        if (isMounted) {
          setError('There was an error checking your group membership. Please try again later.');
        }
      }
    };
    
    checkUserAndGroups();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [user?.id, refetch, userGroups]);
  
  const verifyUserExistsInAuth = async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      console.log('Verifying user existence in auth for ID:', userId);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error('PROFILE VERIFICATION ERROR:', profileError);
        return false;
      }
      
      if (!profileData) {
        console.log('No profile found for user:', userId);
        return false;
      }
      
      console.log('User profile exists:', profileData);
      
      // This section is optional for debugging
      try {
        const { count, error: countError } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error('ERROR counting group_members:', countError);
        } else {
          console.log('TOTAL group_members in database:', count);
        }
      } catch (countErr) {
        console.error('Error counting group members:', countErr);
      }
      
      return true;
    } catch (err) {
      console.error('Error verifying user:', err);
      return false;
    }
  };
  
  if (isLoadingGroups) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground mb-4">
          Your fitness community and accountability group
        </p>
        
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-client" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground mb-4">
          Your fitness community and accountability group
        </p>
        
        <Card className="text-center py-12">
          <CardContent>
            <Mountain className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">Something Went Wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 bg-client text-white rounded-md hover:bg-client/90"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!userGroups || userGroups.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground mb-4">
          Your fitness community and accountability group
        </p>
        
        <Card className="text-center py-12">
          <CardContent>
            <Mountain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">Moai Assignment Pending</h2>
            <p className="text-muted-foreground">
              You'll be assigned to a Moai group shortly. Moai groups help you stay motivated 
              with others on the same fitness journey.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Ensure we have a valid group object before proceeding
  const group: Group = userGroups?.[0] || { id: '', name: 'Loading...', description: '', spotify_playlist_url: null };
  
  return (
    <div className="space-y-6 px-0">
      <p className="text-muted-foreground mb-4 px-[10px]">
        Your fitness community and accountability group
      </p>
      
      <Card className="bg-client/5 relative mx-[10px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-center font-semibold text-black">
            {group.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground pt-0">
          {group.description && <p>{group.description}</p>}
          
          {group.spotify_playlist_url && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => window.open(group.spotify_playlist_url, '_blank')}
              >
                <Music className="h-4 w-4" />
                Team Playlist
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="progress" className="w-full px-[10px]">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="progress" className="flex items-center justify-center">
            <Mountain className="h-5 w-5 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center justify-center">
            <Users className="h-5 w-5 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="coach" className="flex items-center justify-center">
            <UserRound className="h-5 w-5 mr-2" />
            Coach
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="px-0">
          {group.id ? (
            <MoaiGroupProgress groupId={group.id} />
          ) : (
            <div className="text-center p-4">Loading group progress...</div>
          )}
        </TabsContent>
        
        <TabsContent value="members">
          {group.id ? (
            <MoaiMembersTab groupId={group.id} />
          ) : (
            <div className="text-center p-4">Loading members...</div>
          )}
        </TabsContent>
        
        <TabsContent value="coach">
          {group.id ? (
            <MoaiCoachTab groupId={group.id} />
          ) : (
            <div className="text-center p-4">Loading coach information...</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoaiPage;
