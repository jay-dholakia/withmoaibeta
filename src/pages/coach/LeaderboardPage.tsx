
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Loader2, Trophy, Users } from 'lucide-react';
import { fetchAllGroups } from '@/services/client-service';
import GroupLeaderboard from '@/components/coach/GroupLeaderboard';
import TeamStreakLeaderboard from '@/components/coach/TeamStreakLeaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LeaderboardPage = () => {
  const { user } = useAuth();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['all-groups'],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchAllGroups();
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-coach" />
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-7 w-7 text-coach" />
          <h1 className="text-3xl font-bold text-coach">Leaderboards</h1>
        </div>

        <Tabs defaultValue="team-streaks" className="mb-6">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="team-streaks" className="flex-1 flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4" />
              <span>Team Streaks</span>
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex-1 flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Individual</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="team-streaks">
            <TeamStreakLeaderboard />
          </TabsContent>
          
          <TabsContent value="individual">
            {!groups || groups.length === 0 ? (
              <div className="bg-muted/30 p-8 rounded-lg text-center">
                <p className="text-lg mb-2">No groups have been created yet.</p>
                <p className="text-muted-foreground">Individual leaderboards will appear here once groups are created.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {groups.map(group => (
                  <GroupLeaderboard key={group.id} group={group} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CoachLayout>
  );
};

export default LeaderboardPage;
