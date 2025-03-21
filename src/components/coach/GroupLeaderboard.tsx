
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GroupData, LeaderboardEntry, fetchGroupLeaderboardWeekly, fetchGroupLeaderboardMonthly } from '@/services/client-service';
import { Loader2, Trophy, Calendar, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface GroupLeaderboardProps {
  group: GroupData;
}

const GroupLeaderboard: React.FC<GroupLeaderboardProps> = ({ group }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['group-leaderboard-weekly', group.id],
    queryFn: () => fetchGroupLeaderboardWeekly(group.id),
    enabled: timeframe === 'week',
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['group-leaderboard-monthly', group.id],
    queryFn: () => fetchGroupLeaderboardMonthly(group.id),
    enabled: timeframe === 'month',
  });

  const isLoading = timeframe === 'week' ? weeklyLoading : monthlyLoading;
  const leaderboardData = timeframe === 'week' ? weeklyData : monthlyData;

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'bg-yellow-400 border-yellow-500'; // Gold
      case 1: return 'bg-gray-300 border-gray-400'; // Silver
      case 2: return 'bg-amber-700 border-amber-800'; // Bronze
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-coach" />
              {group.name} Leaderboard
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
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-coach" />
          </div>
        ) : !leaderboardData || leaderboardData.length === 0 ? (
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
              {leaderboardData.map((entry, index) => (
                <TableRow key={entry.user_id}>
                  <TableCell className="text-center">
                    {index < 3 ? (
                      <Badge className={`${getMedalColor(index)} text-black font-bold`}>
                        {index + 1}
                      </Badge>
                    ) : (
                      index + 1
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{entry.email}</TableCell>
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
  );
};

export default GroupLeaderboard;
