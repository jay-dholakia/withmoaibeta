
import React from 'react';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchTeamStreaks } from '@/services/client-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Fire } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LeaderboardPage = () => {
  const { data: teamStreaks, isLoading } = useQuery({
    queryKey: ['team-streaks'],
    queryFn: fetchTeamStreaks,
  });

  // Find the team with the highest current streak
  const topTeam = React.useMemo(() => {
    if (!teamStreaks || teamStreaks.length === 0) return null;
    return [...teamStreaks].sort((a, b) => b.current_streak - a.current_streak)[0];
  }, [teamStreaks]);

  return (
    <div className="container max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Team Progress</h1>
      
      <Tabs defaultValue="team" className="mb-6">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="team" className="flex-1 flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <span>Team</span>
          </TabsTrigger>
          <TabsTrigger value="streaks" className="flex-1 flex items-center justify-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Team Streaks</span>
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex-1 flex items-center justify-center gap-2">
            <User className="h-4 w-4" />
            <span>Personal</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="team">
          <WeekProgressSection showTeam={true} showPersonal={false} />
        </TabsContent>

        <TabsContent value="streaks">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {topTeam && topTeam.current_streak > 0 && (
                <Card className="border-2 border-green-500/20 bg-green-50/30 dark:bg-green-950/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" /> 
                      Current Leader
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">{topTeam.group_name}</h3>
                        <p className="text-muted-foreground">
                          {topTeam.all_time_perfect_weeks} all-time perfect weeks
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Fire className="h-5 w-5 text-red-500" />
                          <span className="text-2xl font-bold">{topTeam.current_streak}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">week streak</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Perfect Week Streaks</CardTitle>
                </CardHeader>
                <CardContent>
                  {!teamStreaks || teamStreaks.length === 0 ? (
                    <div className="text-center py-6">
                      <p>No team streak data available yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {[...teamStreaks]
                        .sort((a, b) => b.current_streak - a.current_streak)
                        .map((team) => (
                          <div key={team.group_id} className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{team.group_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {team.monthly_perfect_weeks} perfect {team.monthly_perfect_weeks === 1 ? 'week' : 'weeks'} this month
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {team.current_streak > 0 ? (
                                <Badge className="flex items-center gap-1">
                                  <Fire className={`h-3.5 w-3.5 ${
                                    team.current_streak >= 3 
                                    ? 'text-red-500' 
                                    : team.current_streak >= 2 
                                    ? 'text-orange-400' 
                                    : 'text-yellow-400'
                                  }`} />
                                  <span>{team.current_streak}</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline">0</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="personal">
          <WeekProgressSection showTeam={false} showPersonal={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardPage;
