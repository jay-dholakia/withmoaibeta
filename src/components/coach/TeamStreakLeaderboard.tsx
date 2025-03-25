import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamStreakEntry, fetchTeamStreaks } from '@/services/client-service';
import { Loader2, Trophy, Calendar, CalendarDays, Flame } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const TeamStreakLeaderboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'month' | 'all-time'>('month');

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['team-streaks'],
    queryFn: fetchTeamStreaks,
  });

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'bg-yellow-400 border-yellow-500'; // Gold
      case 1: return 'bg-gray-300 border-gray-400'; // Silver
      case 2: return 'bg-amber-700 border-amber-800'; // Bronze
      default: return '';
    }
  };

  const sortedTeams = React.useMemo(() => {
    if (!teamsData) return [];
    
    return [...teamsData].sort((a, b) => {
      if (timeframe === 'month') {
        return b.monthly_perfect_weeks - a.monthly_perfect_weeks;
      } else {
        return b.all_time_perfect_weeks - a.all_time_perfect_weeks;
      }
    });
  }, [teamsData, timeframe]);

  const chartData = React.useMemo(() => {
    if (!sortedTeams) return [];
    
    return sortedTeams.map(team => ({
      name: team.group_name,
      value: timeframe === 'month' ? team.monthly_perfect_weeks : team.all_time_perfect_weeks,
      fill: team.current_streak > 0 ? '#22c55e' : '#d1d5db',
    }));
  }, [sortedTeams, timeframe]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-coach" />
              Team Streak Leaderboard
            </CardTitle>
            <CardDescription>
              Perfect week streaks {timeframe === 'month' ? 'this month' : 'all time'}
            </CardDescription>
          </div>
          <ToggleGroup 
            type="single" 
            value={timeframe} 
            onValueChange={(value) => value && setTimeframe(value as 'month' | 'all-time')}
          >
            <ToggleGroupItem value="month" aria-label="Monthly view">
              <Calendar className="h-4 w-4 mr-1" />
              Month
            </ToggleGroupItem>
            <ToggleGroupItem value="all-time" aria-label="All-time view">
              <CalendarDays className="h-4 w-4 mr-1" />
              All-time
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-coach" />
          </div>
        ) : !sortedTeams || sortedTeams.length === 0 ? (
          <div className="text-center py-6 bg-muted/30 rounded-lg">
            <p>No team streak data available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-64">
              <ChartContainer config={{}} className="h-full w-full">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" name="Perfect Weeks" />
                </BarChart>
              </ChartContainer>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">Current Streak</TableHead>
                  <TableHead className="text-right">
                    {timeframe === 'month' ? 'Monthly Perfect Weeks' : 'All-time Perfect Weeks'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeams.map((team, index) => (
                  <TableRow key={team.group_id}>
                    <TableCell className="text-center">
                      {index < 3 ? (
                        <Badge className={`${getMedalColor(index)} text-black font-bold`}>
                          {index + 1}
                        </Badge>
                      ) : (
                        index + 1
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{team.group_name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {team.current_streak > 0 ? (
                          <>
                            <Flame className={`h-4 w-4 ${
                              team.current_streak >= 3 
                              ? 'text-red-500' 
                              : team.current_streak >= 2 
                              ? 'text-orange-400' 
                              : 'text-yellow-400'
                            }`} />
                            <span>{team.current_streak}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={team.current_streak > 0 ? "default" : "secondary"} className="font-mono">
                        {timeframe === 'month' ? team.monthly_perfect_weeks : team.all_time_perfect_weeks}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamStreakLeaderboard;
