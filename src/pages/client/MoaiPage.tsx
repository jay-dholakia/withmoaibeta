
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mountain, Users, UserRound } from 'lucide-react';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import MoaiMembersTab from '@/components/client/MoaiMembersTab';
import MoaiGroupProgress from '@/components/client/MoaiGroupProgress';
import { 
  fetchUserGroups, 
  diagnoseGroupAccess, 
  verifyUserGroupMembership
} from '@/services/moai-service';
import { supabase } from '@/integrations/supabase/client';

const MoaiPage = () => {
  const { user } = useAuth();
  const [diagnosticDetails, setDiagnosticDetails] = useState<any>(null);
  
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
        return groups;
      } catch (err) {
        console.error('Error fetching groups:', err);
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
    if (user?.id) {
      verifyUserExistsInAuth(user.id);
      diagnoseGroupAccess(user.id)
        .then(result => {
          console.log('Group access diagnosis result:', result);
          setDiagnosticDetails(result);
          
          if (result.hasGroupMemberships && (!userGroups || userGroups.length === 0)) {
            refetch();
          }
        })
        .catch(error => {
          console.error('Error diagnosing group access:', error);
        });
    }
  }, [user?.id, refetch, userGroups]);
  
  const verifyUserExistsInAuth = async (userId: string) => {
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
      
      console.log('User profile exists:', profileData);
      
      const { count, error: countError } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('ERROR counting group_members:', countError);
      } else {
        console.log('TOTAL group_members in database:', count);
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
  
  const group = userGroups[0];
  
  return (
    <div className="space-y-6">
      <Card className="bg-client/5 relative">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-center font-semibold text-black">
            {group.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground pt-0">
          {group.description && <p>{group.description}</p>}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="progress" className="w-full">
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
        
        <TabsContent value="progress">
          <MoaiGroupProgress groupId={group.id} />
        </TabsContent>
        
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
