
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, UserRound, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import MoaiMembersTab from '@/components/client/MoaiMembersTab';
import { toast } from 'sonner';
import { fetchUserGroups, diagnoseGroupAccess, verifyUserGroupMembership, ensureUserHasGroup } from '@/services/moai-service';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const MoaiPage = () => {
  const { user } = useAuth();
  const [diagnosticDetails, setDiagnosticDetails] = useState<any>(null);
  const [isFixingGroup, setIsFixingGroup] = useState(false);
  
  // Fetch the user's groups with improved error handling and logging
  const { data: userGroups, isLoading: isLoadingGroups, refetch } = useQuery({
    queryKey: ['client-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for group fetch');
        return [];
      }
      
      console.log('Fetching groups for user ID:', user.id);
      try {
        // First do a direct database query to check membership
        const { data: membershipData, error: membershipError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);
          
        if (membershipError) {
          console.error('Direct membership check error:', membershipError);
        } else {
          console.log('Direct membership check result:', membershipData);
        }
        
        // Then use the service function to get full group details
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
    gcTime: 10000, // Short cache time
  });
  
  // Enhanced diagnostics on mount
  useEffect(() => {
    if (user?.id) {
      verifyUserExistsInAuth(user.id);
      diagnoseGroupAccess(user.id)
        .then(result => {
          console.log('Group access diagnosis result:', result);
          setDiagnosticDetails(result);
          
          if (!result.success) {
            toast.error('Diagnostic check failed. Check console for details.');
          } else if (!result.hasGroupMemberships) {
            console.warn('Diagnostic confirms user has no group memberships');
          }
          
          // If we found new group memberships that weren't showing before, refresh the groups
          if (result.hasGroupMemberships && (!userGroups || userGroups.length === 0)) {
            toast.success('Group memberships detected, refreshing...');
            refetch();
          }
        });
    }
  }, [user?.id]);
  
  // Verify the user actually exists in auth
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
      
      // Also check group_members count in the entire table
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
      toast.error('No user ID available');
      return;
    }
    
    setIsFixingGroup(true);
    toast.info('Attempting to fix group assignment...');
    
    try {
      // First, check available groups
      const { data: availableGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .order('created_at', { ascending: false });
        
      if (groupsError) {
        console.error('Error checking available groups:', groupsError);
        toast.error('Failed to check available groups');
        return;
      }
      
      console.log('Available groups before fix:', availableGroups);
      
      // Proceed with fix attempt
      const result = await ensureUserHasGroup(user.id);
      console.log('Group assignment fix result:', result);
      
      if (result.success) {
        toast.success('Successfully fixed group assignment!');
        // Refresh the data
        refetch();
        // Re-run diagnostics
        const diagResult = await diagnoseGroupAccess(user.id);
        setDiagnosticDetails(diagResult);
      } else {
        toast.error(`Failed to fix group assignment: ${result.message}`);
        // Fixed: Safely access details property only if it exists
        if ('details' in result && result.details) {
          console.error('Fix error details:', result.details);
        }
      }
    } catch (err) {
      console.error('Error fixing group assignment:', err);
      toast.error('Unexpected error fixing group assignment');
    } finally {
      setIsFixingGroup(false);
    }
  };
  
  const runDiagnostics = async () => {
    if (!user?.id) {
      toast.error('No user ID available');
      return;
    }
    
    toast.info('Running group access diagnostics...');
    try {
      // Verify user exists first
      const userExists = await verifyUserExistsInAuth(user.id);
      if (!userExists) {
        toast.error('User profile not found in database!');
      }
      
      // Check for direct group membership using raw query
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('user_id', user.id);
        
      if (membershipError) {
        console.error('Error checking memberships:', membershipError);
        toast.error('Error checking group memberships');
      } else {
        console.log('Direct membership check:', membershipData);
        if (membershipData.length === 0) {
          toast.warning('No direct group memberships found');
        } else {
          toast.success(`Found ${membershipData.length} group memberships`);
        }
      }
      
      // Check for available groups
      const { data: availableGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name');
        
      if (groupsError) {
        console.error('Error checking available groups:', groupsError);
        toast.error('Failed to check available groups');
      } else {
        console.log('Available groups:', availableGroups);
        if (availableGroups.length === 0) {
          toast.warning('No groups exist in the system yet');
        } else {
          toast.info(`There are ${availableGroups.length} groups in the system`);
        }
      }
      
      // Run the full diagnostic
      const result = await diagnoseGroupAccess(user.id);
      console.log('Comprehensive diagnostic result:', result);
      setDiagnosticDetails(result);
      
      if (result.success) {
        if (result.hasGroupMemberships) {
          toast.success(`Found ${result.groupMembershipsCount} group membership(s)`);
        } else {
          toast.warning('Diagnostic complete. No group memberships found.');
        }
      } else {
        toast.error(`Diagnostic failed: ${result.message}`);
      }
      
      // Force a fresh reload of groups data
      refetch();
    } catch (err) {
      console.error('Error running diagnostics:', err);
      toast.error('Diagnostic failed with an error');
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
