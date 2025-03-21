
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, UserRound, AlertTriangle, UserPlus } from 'lucide-react';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import MoaiMembersTab from '@/components/client/MoaiMembersTab';
import { toast } from 'sonner';
import { fetchUserGroups, diagnoseGroupAccess, ensureUserHasGroup } from '@/services/moai-service';
import { Button } from '@/components/ui/button';

const MoaiPage = () => {
  const { user } = useAuth();
  
  // First, fetch the user's groups with improved error handling and logging
  const { data: userGroups, isLoading: isLoadingGroups, refetch } = useQuery({
    queryKey: ['client-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for group fetch');
        return [];
      }
      
      console.log('Fetching groups for user ID:', user.id);
      return fetchUserGroups(user.id);
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 10000, // Short cache time
  });
  
  // Run diagnostics on mount to help identify permission issues
  useEffect(() => {
    if (user?.id) {
      diagnoseGroupAccess(user.id)
        .then(result => {
          console.log('Group access diagnosis result:', result);
          if (!result.success) {
            toast.error('Diagnostic check failed. Check console for details.');
          } else if (!result.hasGroupMemberships) {
            console.warn('Diagnostic confirms user has no group memberships');
          }
        });
    }
  }, [user?.id]);
  
  const runDiagnostics = async () => {
    if (!user?.id) {
      toast.error('No user ID available');
      return;
    }
    
    toast.info('Running group access diagnostics...');
    try {
      const result = await diagnoseGroupAccess(user.id);
      console.log('Diagnostic result:', result);
      
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
  
  const joinGroup = async () => {
    if (!user?.id) {
      toast.error('No user ID available');
      return;
    }
    
    toast.info('Attempting to join your group...');
    try {
      const result = await ensureUserHasGroup(user.id);
      console.log('Join group result:', result);
      
      if (result.success) {
        toast.success('Successfully joined your group!');
        // Force a fresh reload of groups data
        refetch();
      } else {
        toast.error(`Failed to join group: ${result.message}`);
      }
    } catch (err) {
      console.error('Error joining group:', err);
      toast.error('Failed to join group');
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
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={runDiagnostics}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Diagnose Group Access
              </Button>
              
              <Button 
                variant="default"
                onClick={joinGroup}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Join Your Group
              </Button>
            </div>
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
