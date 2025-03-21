
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchGroupWeeklyProgress } from '@/services/client-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Check, Calendar, Loader2 } from 'lucide-react';

const MoaiPage = () => {
  const { user } = useAuth();
  
  // First, fetch the user's groups
  const { data: userGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['client-groups', user?.id],
    queryFn: async () => {
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
        
      if (error) throw error;
      return data.map(item => item.group);
    },
    enabled: !!user?.id,
  });
  
  // For each group, fetch the weekly progress
  const { data: groupProgressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['group-weekly-progress', userGroups?.[0]?.id],
    queryFn: () => fetchGroupWeeklyProgress(userGroups?.[0]?.id || ''),
    enabled: !!userGroups && userGroups.length > 0,
  });
  
  if (isLoadingGroups || isLoadingProgress) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your Moai</h1>
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
        <h1 className="text-2xl font-bold">Your Moai</h1>
        
        <Card className="text-center py-12">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">No Groups Found</h2>
            <p className="text-muted-foreground">
              You're not currently assigned to any group. Groups help you stay motivated 
              with others on the same fitness journey.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const group = userGroups[0];
  const groupProgress = groupProgressData;
  
  if (!groupProgress) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your Moai</h1>
        <p className="text-muted-foreground mb-4">Group: {group.name}</p>
        
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">No Progress Data</h2>
            <p className="text-muted-foreground">
              No workout progress data is available for this week yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Calculate overall group completion percentage
  const members = groupProgress.members;
  const totalAssigned = members.reduce((sum: number, member: any) => sum + member.totalAssigned, 0);
  const totalCompleted = members.reduce((sum: number, member: any) => sum + member.totalCompleted, 0);
  const completionPercentage = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
  
  // Get date range for the week
  const startDate = new Date(groupProgress.startOfWeek);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const dateRangeString = `${startDate.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  })} - ${endDate.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })}`;
  
  // Days of the week abbreviations
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Moai</h1>
        <p className="text-muted-foreground">Group: {group.name}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Progress</CardTitle>
          <CardDescription>{dateRangeString}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Group Completion</span>
              <span className="font-medium">{totalCompleted} / {totalAssigned} workouts</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          <div className="pt-4 space-y-4">
            {members.map((member: any) => (
              <div key={member.userId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium">
                    {member.email}
                    {member.userId === user?.id && (
                      <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.totalCompleted} / {member.totalAssigned}
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {daysOfWeek.map((day, i) => {
                    const isCompleted = member.weekData[i]?.completed;
                    
                    return (
                      <div 
                        key={i} 
                        className={`aspect-square flex flex-col items-center justify-center text-xs rounded-md ${
                          isCompleted 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        <span>{day}</span>
                        {isCompleted && <Check className="h-3 w-3" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {group.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About This Group</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{group.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MoaiPage;
