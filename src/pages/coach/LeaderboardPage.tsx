
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Trophy, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchGroupLeaderboard, GroupLeaderboardItem } from '@/services/group-leaderboard-service';
import { Award } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  // Get group leaderboard data (groups ranked by fire badges)
  const { 
    data: groupsLeaderboard,
    isLoading: isLoadingGroups,
    error: groupsError
  } = useQuery({
    queryKey: ['group-leaderboard'],
    queryFn: fetchGroupLeaderboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to get current group ID (simplified for demo)
  const getGroupId = async (): Promise<string | null> => {
    try {
      // Fetch the first group the coach is associated with
      const { data, error } = await supabase
        .from('group_coaches')
        .select('group_id')
        .eq('coach_id', user?.id)
        .limit(1);
        
      if (error) throw error;
      return data && data.length > 0 ? data[0].group_id : null;
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  };

  // Calculate start date for weekly and monthly periods
  const getStartDate = (period: 'weekly' | 'monthly'): string => {
    const date = new Date();
    if (period === 'weekly') {
      // Set to beginning of current week (Monday)
      const day = date.getDay();
      const diff = (day === 0 ? 6 : day - 1); // adjust when day is Sunday
      date.setDate(date.getDate() - diff);
    } else {
      // Set to beginning of current month
      date.setDate(1);
    }
    
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  };

  // Fetch leaderboard data with user profiles
  const fetchLeaderboard = async (period: 'weekly' | 'monthly'): Promise<LeaderboardEntry[]> => {
    const groupId = await getGroupId();
    
    if (!groupId) {
      console.log("No group found for coach");
      return [];
    }
    
    const startDate = getStartDate(period);
    const functionName = period === 'weekly' 
      ? 'get_group_weekly_leaderboard' 
      : 'get_group_monthly_leaderboard';
    
    try {
      // First get the leaderboard data
      const { data: leaderboardData, error: leaderboardError } = await supabase.rpc(
        functionName,
        { group_id: groupId, start_date: startDate }
      );
      
      if (leaderboardError) throw leaderboardError;
      
      if (!leaderboardData || leaderboardData.length === 0) {
        return [];
      }
      
      // Then enhance with user profile info
      const enhancedData = await Promise.all(
        leaderboardData.map(async (entry) => {
          const { data: profileData } = await supabase
            .from('client_profiles')
            .select('first_name, last_name')
            .eq('id', entry.user_id)
            .single();
            
          return { 
            ...entry,
            first_name: profileData?.first_name,
            last_name: profileData?.last_name
          };
        })
      );
      
      return enhancedData;
    } catch (error) {
      console.error(`Error fetching ${period} leaderboard:`, error);
      return [];
    }
  };

  // Format display name to show full first name and initial of last name
  const formatDisplayName = (entry: LeaderboardEntry): string => {
    if (entry.first_name) {
      return `${entry.first_name}${entry.last_name ? ` ${entry.last_name.charAt(0)}.` : ''}`;
    }
    // Fallback to email username if profile not available
    return entry.email.split('@')[0];
  };
  
  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  // Weekly leaderboard query
  const { 
    data: weeklyLeaderboard, 
    isLoading: isLoadingWeekly,
    error: weeklyError 
  } = useQuery({
    queryKey: ['weekly-leaderboard', user?.id],
    queryFn: () => fetchLeaderboard('weekly'),
    enabled: !!user?.id
  });

  // Monthly leaderboard query
  const { 
    data: monthlyLeaderboard, 
    isLoading: isLoadingMonthly,
    error: monthlyError 
  } = useQuery({
    queryKey: ['monthly-leaderboard', user?.id],
    queryFn: () => fetchLeaderboard('monthly'),
    enabled: !!user?.id
  });

  const renderLeaderboardTable = (
    data: LeaderboardEntry[] | undefined, 
    isLoading: boolean,
    error: unknown
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full dark:bg-gray-700" />
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-4 text-center text-destructive dark:text-red-400">
          <p>Error loading leaderboard data.</p>
          <p className="text-sm text-muted-foreground dark:text-gray-400">Please try again later.</p>
        </div>
      );
    }
    
    if (!data || data.length === 0) {
      return (
        <div className="p-8 text-center">
          <p className="text-lg mb-2 dark:text-gray-300">No workout data found for this period.</p>
          <p className="text-muted-foreground dark:text-gray-400">
            Encourage your clients to complete workouts to see them on the leaderboard.
          </p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow className="dark:border-gray-700">
            <TableHead className="w-16 text-center dark:text-gray-300">Rank</TableHead>
            <TableHead className="dark:text-gray-300">Client</TableHead>
            <TableHead className="text-right dark:text-gray-300">Completed Workouts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, index) => (
            <TableRow key={entry.user_id} className="dark:border-gray-700">
              <TableCell className="text-center font-medium dark:text-gray-300">
                {index === 0 ? '🏆' : index + 1}
              </TableCell>
              <TableCell className="dark:text-gray-300">
                {formatDisplayName(entry)}
              </TableCell>
              <TableCell className="text-right font-medium dark:text-gray-300">
                {entry.total_workouts}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-7 w-7 text-coach dark:text-green-400" />
          <h1 className="text-3xl font-bold text-coach dark:text-green-400">Leaderboards</h1>
        </div>

        {/* Group Leaderboard Section */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="dark:text-white">Group Fire Badge Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGroups ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : groupsError ? (
              <div className="text-center py-6">
                <p className="text-red-500">Error loading groups leaderboard</p>
              </div>
            ) : !groupsLeaderboard || groupsLeaderboard.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No groups data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupsLeaderboard.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleGroupExpansion(group.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-client/10 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                          <span className="text-client dark:text-blue-300 font-bold">
                            #{group.rank}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{group.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Award className="h-4 w-4 mr-1 text-orange-500" />
                            <span>{group.total_fire_badges} fire {group.total_fire_badges === 1 ? 'badge' : 'badges'}</span>
                          </div>
                        </div>
                      </div>
                      {expandedGroups.includes(group.id) ? 
                        <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      }
                    </div>
                    
                    {expandedGroups.includes(group.id) && (
                      <div className="border-t border-border p-3">
                        <div className="mb-2 flex items-center text-sm font-medium text-muted-foreground px-1">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Group Members</span>
                        </div>
                        <div className="space-y-2">
                          {group.members && group.members
                            .sort((a, b) => b.fire_badges_count - a.fire_badges_count)
                            .map((member) => (
                              <div key={member.user_id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {member.first_name?.[0]}{member.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {`${member.first_name || ''} ${member.last_name?.[0] || ''}.`.trim()}
                                  </span>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Award className="h-3.5 w-3.5 mr-1 text-orange-500" />
                                  <span>{member.fire_badges_count}</span>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Original Weekly/Monthly Leaderboard */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Client Workout Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="weekly" 
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'weekly' | 'monthly')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 dark:bg-gray-700">
                <TabsTrigger 
                  value="weekly" 
                  className="dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white"
                >
                  Weekly
                </TabsTrigger>
                <TabsTrigger 
                  value="monthly" 
                  className="dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white"
                >
                  Monthly
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                {renderLeaderboardTable(weeklyLeaderboard, isLoadingWeekly, weeklyError)}
              </TabsContent>
              
              <TabsContent value="monthly">
                {renderLeaderboardTable(monthlyLeaderboard, isLoadingMonthly, monthlyError)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

// Define interface for leaderboard entries
interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
  first_name?: string | null;
  last_name?: string | null;
}

export default LeaderboardPage;
