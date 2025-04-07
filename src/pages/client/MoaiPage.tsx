
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MoaiMembersTab from '@/components/client/MoaiMembersTab';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import MoaiGroupProgress from '@/components/client/MoaiGroupProgress';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentWeekNumber } from '@/services/assigned-workouts-service';
import { fetchCurrentProgram } from '@/services/program-service';
import { fetchUserGroups } from '@/services/moai-service';

export default function MoaiPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(1);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // Fetch user's groups
  const { data: userGroups, isLoading: isLoadingUserGroups } = useQuery({
    queryKey: ['user-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log("Fetching user groups for:", user.id);
      const groups = await fetchUserGroups(user.id);
      console.log("User groups:", groups);
      return groups;
    },
    enabled: !!user?.id,
  });
  
  // Set active group ID based on URL param or first available group
  useEffect(() => {
    if (groupId) {
      setActiveGroupId(groupId);
    } else if (userGroups && userGroups.length > 0) {
      console.log("Setting active group to first group:", userGroups[0].id);
      setActiveGroupId(userGroups[0].id);
    }
  }, [groupId, userGroups]);
  
  // Fetch group data
  const { data: groupData, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['moai-group', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return null;
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_coaches(*)')
        .eq('id', activeGroupId)
        .single();
      
      if (error) throw error;
      console.log("Fetched group data:", data);
      return data;
    },
    enabled: !!activeGroupId,
  });
  
  // Fetch current program
  const { data: currentProgram, isLoading: isLoadingProgram } = useQuery({
    queryKey: ['current-program', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await fetchCurrentProgram(user.id);
    },
    enabled: !!user?.id,
  });
  
  // Set current week number based on program start date
  useEffect(() => {
    if (currentProgram?.start_date) {
      const startDate = new Date(currentProgram.start_date);
      const weekNumber = getCurrentWeekNumber(startDate);
      setCurrentWeekNumber(weekNumber);
    }
  }, [currentProgram]);
  
  if (isLoadingGroup || isLoadingProgram || isLoadingUserGroups) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
      </div>
    );
  }
  
  // No groups found
  if ((!activeGroupId || !groupData) && (!userGroups || userGroups.length === 0)) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <p className="text-muted-foreground text-center">No groups found. You aren't assigned to any Moai group yet.</p>
        <p className="text-sm text-muted-foreground text-center">Please contact your coach or administrator.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {currentProgram?.program && (
        <Card className="border-none shadow-none bg-slate-50">
          <CardHeader className="text-center py-2 px-4">
            <CardTitle className="text-lg font-medium">
              {currentProgram.program.title} • Week {currentWeekNumber || 1}
            </CardTitle>
          </CardHeader>
        </Card>
      )}
      
      {/* Group selector if multiple groups */}
      {userGroups && userGroups.length > 1 && (
        <div className="flex justify-center">
          <select
            value={activeGroupId || ''}
            onChange={(e) => setActiveGroupId(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            {userGroups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="coach">Coach</TabsTrigger>
            </TabsList>
            <TabsContent value="progress" className="pt-4">
              <MoaiGroupProgress 
                groupId={activeGroupId || ''} 
                currentProgram={currentProgram}
              />
            </TabsContent>
            <TabsContent value="members">
              <MoaiMembersTab groupId={activeGroupId || ''} />
            </TabsContent>
            <TabsContent value="coach">
              <MoaiCoachTab groupId={activeGroupId || ''} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
