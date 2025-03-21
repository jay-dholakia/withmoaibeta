
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, UserRound } from 'lucide-react';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import MoaiMembersTab from '@/components/client/MoaiMembersTab';
import { toast } from 'sonner';

const MoaiPage = () => {
  const { user } = useAuth();
  
  // First, fetch the user's groups with improved error handling and logging
  const { data: userGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['client-groups', user?.id],
    queryFn: async () => {
      console.log('Fetching groups for user ID:', user?.id);
      
      try {
        const { data, error } = await supabase
          .from('group_members')
          .select(`
            group_id,
            group:group_id (
              id,
              name,
              description
            )
          `)
          .eq('user_id', user?.id || '');
          
        if (error) {
          console.error('Error fetching user groups:', error);
          throw error;
        }
        
        console.log('Retrieved group members data:', data);
        
        if (!data || data.length === 0) {
          console.log('No group assignments found for user');
          return [];
        }
        
        // Extract and filter out any null group values
        const groups = data
          .map(item => item.group)
          .filter(group => group !== null);
          
        console.log('Extracted groups:', groups);
        return groups;
      } catch (err) {
        console.error('Unexpected error in group fetch:', err);
        toast.error('Failed to load your groups');
        return [];
      }
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 10000, // Short cache time
  });
  
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
  
  if (!userGroups || userGroups.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground mb-4">
          Your fitness community and accountability group
        </p>
        
        <Card className="text-center py-12">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">No Groups Found</h2>
            <p className="text-muted-foreground">
              You're not currently assigned to any group. Groups help you stay motivated 
              with others on the same fitness journey.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              User ID: {user?.id || 'Not logged in'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const group = userGroups[0];
  
  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">Group: {group.name}</p>
        {group.description && (
          <p className="text-muted-foreground mt-1 text-sm">{group.description}</p>
        )}
      </div>
      
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Group Members
          </TabsTrigger>
          <TabsTrigger value="coach">
            <UserRound className="h-4 w-4 mr-2" />
            Coach
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <MoaiMembersTab groupId={group.id} />
        </TabsContent>
        
        <TabsContent value="coach">
          <MoaiCoachTab groupId={group.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoaiPage;
