import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, UserRound, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { fetchUserGroups, diagnoseGroupAccess, verifyUserGroupMembership, ensureUserHasGroup } from '@/services/moai-service';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const MoaiPage = () => {
  const { user } = useAuth();
  const [diagnosticDetails, setDiagnosticDetails] = useState<any>(null);
  const [isFixingGroup, setIsFixingGroup] = useState(false);
  
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
        });
    }
  }, [user?.id]);
  
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
  
  const fixGroupAssignment = async () => {
    if (!user?.id) {
      return;
    }
    
    setIsFixingGroup(true);
    
    try {
      const { data: availableGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .order('created_at', { ascending: false });
        
      if (groupsError) {
        console.error('Error checking available groups:', groupsError);
        return;
      }
      
      console.log('Available groups before fix:', availableGroups);
      
      const result = await ensureUserHasGroup(user.id);
      console.log('Group assignment fix result:', result);
      
      if (result.success) {
        refetch();
        const diagResult = await diagnoseGroupAccess(user.id);
        setDiagnosticDetails(diagResult);
      } else {
        if ('details' in result && result.details) {
          console.error('Fix error details:', result.details);
        }
      }
    } catch (err) {
      console.error('Error fixing group assignment:', err);
    } finally {
      setIsFixingGroup(false);
    }
  };
  
  const runDiagnostics = async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      const userExists = await verifyUserExistsInAuth(user.id);
      if (!userExists) {
        console.error('User profile not found in database!');
      }
      
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('user_id', user.id);
        
      if (membershipError) {
        console.error('Error checking memberships:', membershipError);
      } else {
        console.log('Direct membership check:', membershipData);
      }
      
      const { data: availableGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name');
        
      if (groupsError) {
        console.error('Error checking available groups:', groupsError);
      } else {
        console.log('Available groups:', availableGroups);
      }
      
      const result = await diagnoseGroupAccess(user.id);
      console.log('Comprehensive diagnostic result:', result);
      setDiagnosticDetails(result);
      
      refetch();
    } catch (err) {
      console.error('Error running diagnostics:', err);
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
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">No Groups Found</h2>
            <p className="text-muted-foreground">
              You're not currently assigned to any group. Groups help you stay motivated 
              with others on the same fitness journey.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              User ID: {user?.id || 'Not logged in'}
            </p>
            
            <div className="mt-6 flex justify-center gap-3">
              <Button 
                onClick={fixGroupAssignment}
                className="flex items-center gap-2"
                disabled={isFixingGroup}
              >
                <RefreshCw className={`h-4 w-4 ${isFixingGroup ? 'animate-spin' : ''}`} />
                {isFixingGroup ? 'Fixing...' : 'Fix Group Assignment'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={runDiagnostics}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Deep Diagnostic Scan
              </Button>
            </div>
            
            {diagnosticDetails && (
              <div className="mt-6 p-4 border rounded text-left text-sm bg-gray-50">
                <h3 className="font-medium mb-2">Diagnostic Results:</h3>
                <div className="space-y-1">
                  <p>Status: {diagnosticDetails.success ? 'Success' : 'Failed'}</p>
                  <p>Has Memberships: {diagnosticDetails.hasGroupMemberships ? 'Yes' : 'No'}</p>
                  {diagnosticDetails.message && <p>Message: {diagnosticDetails.message}</p>}
                  {diagnosticDetails.groupMembershipsCount !== undefined && (
                    <p>Membership Count: {diagnosticDetails.groupMembershipsCount}</p>
                  )}
                  {diagnosticDetails.groupMemberships && diagnosticDetails.groupMemberships.length > 0 && (
                    <div>
                      <p className="font-medium">Membership Details:</p>
                      <pre className="text-xs bg-gray-100 p-2 overflow-auto max-h-32">
                        {JSON.stringify(diagnosticDetails.groupMemberships, null, 2)}
                      </pre>
                    </div>
                  )}
                  {diagnosticDetails.availableGroups && diagnosticDetails.availableGroups.length > 0 && (
                    <div>
                      <p className="font-medium">Available Groups:</p>
                      <ul className="list-disc pl-5 text-xs">
                        {diagnosticDetails.availableGroups.map((g: any) => (
                          <li key={g.id}>{g.name} ({g.id.substring(0, 8)}...)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const group = userGroups[0];
  
  return (
    <div className="space-y-6">
      <Card className="bg-client/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-center font-semibold text-black">
            🏃‍♀️ Pace Setters 🏃‍♂️
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground pt-0">
          {group.description && <p>{group.description}</p>}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="progress">
            <Users className="h-4 w-4 mr-2" />
            Group Progress
          </TabsTrigger>
          <TabsTrigger value="coach">
            <UserRound className="h-4 w-4 mr-2" />
            Coach
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress">
          <WeekProgressSection 
            showTeam={false} 
            showPersonal={false}
            showGroupMembers={true}
            enableMemberClick={true}
            workoutTypesMap={{}}
          />
        </TabsContent>
        
        <TabsContent value="coach">
          <MoaiCoachTab groupId={group.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoaiPage;
