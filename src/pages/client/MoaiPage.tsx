
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

export default function MoaiPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(1);
  
  // Fetch group data
  const { data: groupData, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['moai-group', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_coaches(*)')
        .eq('id', groupId)
        .single();
      
      if (error) throw error;
      console.log("Fetched group data:", data);
      return data;
    },
    enabled: !!groupId,
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
  
  if (isLoadingGroup || isLoadingProgram) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
      </div>
    );
  }
  
  if (!groupId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">No group selected.</p>
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
                groupId={groupId || ''} 
                currentProgram={currentProgram}
              />
            </TabsContent>
            <TabsContent value="members">
              <MoaiMembersTab groupId={groupId || ''} />
            </TabsContent>
            <TabsContent value="coach">
              <MoaiCoachTab groupId={groupId || ''} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
