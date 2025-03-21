
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchGroupLeaderboardWeekly, fetchGroupLeaderboardMonthly } from '@/services/client-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2, Trophy, Calendar, CalendarDays, Users } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  
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
  
  // Then fetch the leaderboard for the user's first group
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['client-leaderboard-weekly', userGroups?.[0]?.id],
    queryFn: () => fetchGroupLeaderboardWeekly(userGroups?.[0]?.id || ''),
    enabled: !!userGroups && userGroups.length > 0 && timeframe === 'week',
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['client-leaderboard-monthly', userGroups?.[0]?.id],
    queryFn: () => fetchGroupLeaderboardMonthly(userGroups?.[0]?.id || ''),
    enabled: !!userGroups && userGroups.length > 0 && timeframe === 'month',
  });

  const isLoading = isLoadingGroups || (timeframe === 'week' ? weeklyLoading : monthlyLoading);
  const leaderboardData = timeframe === 'week' ? weeklyData : monthlyData;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-client" />
        </div>
      </div>
    );
  }
  
  if (!userGroups || userGroups.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">No Groups Found</h2>
            <p className="text-muted-foreground">
              You're not currently assigned to any group. Groups help you compare 
              progress with others on the same fitness journey.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const group = userGroups[0];
  
  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'bg-yellow-400 border-yellow-500'; // Gold
      case 1: return 'bg-gray-300 border-gray-400'; // Silver
      case 2: return 'bg-amber-700 border-amber-800'; // Bronze
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">Group: {group.name}</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-client" />
                Workout Challenge
              </CardTitle>
              <CardDescription>
                Workouts completed {timeframe === 'week' ? 'this week' : 'this month'}
              </CardDescription>
            </div>
            <ToggleGroup type="single" value={timeframe} onValueChange={(value) => value && setTimeframe(value as 'week' | 'month')}>
              <ToggleGroupItem value="week" aria-label="Weekly view">
                <Calendar className="h-4 w-4 mr-1" />
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Monthly view">
                <CalendarDays className="h-4 w-4 mr-1" />
                Month
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          {!leaderboardData || leaderboardData.length === 0 ? (
            <div className="text-center py-6 bg-muted/30 rounded-lg">
              <p>No workout data available for this {timeframe}.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Rank</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Workouts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((entry: any, index: number) => (
                  <TableRow key={entry.user_id} className={entry.user_id === user?.id ? "bg-muted/20" : ""}>
                    <TableCell className="text-center">
                      {index < 3 ? (
                        <Badge className={`${getMedalColor(index)} text-black font-bold`}>
                          {index + 1}
                        </Badge>
                      ) : (
                        index + 1
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.email}
                      {entry.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono">
                        {entry.total_workouts}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
