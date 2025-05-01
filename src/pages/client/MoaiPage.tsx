import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MoaiMembersTab from '@/components/client/MoaiMembersTab';
import MoaiCoachTab from '@/components/client/MoaiCoachTab';
import MoaiGroupProgress from '@/components/client/MoaiGroupProgress';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Music, Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentWeekNumber } from '@/services/assigned-workouts-service';
import { fetchCurrentProgram } from '@/services/program-service';
import { fetchUserGroups } from '@/services/moai-service';
import { Button } from '@/components/ui/button';
import { getUserBuddies, generateWeeklyBuddies } from '@/services/accountability-buddy-service';
import { AccountabilityBuddyCard } from '@/components/client/AccountabilityBuddyCard';
import { BuddyDisplayInfo } from '@/services/accountability-buddy-service';

const VALID_TABS = ['progress', 'members', 'coach'];
const DEFAULT_TAB = 'progress';

export default function MoaiPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(1);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isGeneratingBuddies, setIsGeneratingBuddies] = useState(false);

  const currentQueryTab = searchParams.get('tab');
  const activeTab = currentQueryTab && VALID_TABS.includes(currentQueryTab) ? currentQueryTab : DEFAULT_TAB;

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

  useEffect(() => {
    if (groupId) {
      setActiveGroupId(groupId);
      if (!currentQueryTab || !VALID_TABS.includes(currentQueryTab)) {
        setSearchParams({ tab: DEFAULT_TAB }, { replace: true });
      }
    } else if (userGroups && userGroups.length > 0 && !isLoadingUserGroups) {
      const firstGroupId = userGroups[0].id;
      console.log("Redirecting to first group:", firstGroupId);
      navigate(`/client-dashboard/moai/${firstGroupId}`, { replace: true });
    }
  }, [groupId, userGroups, isLoadingUserGroups, navigate, currentQueryTab, setSearchParams]);

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

  const { data: currentProgram, isLoading: isLoadingProgram } = useQuery({
    queryKey: ['current-program', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await fetchCurrentProgram(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: buddies, isLoading: isLoadingBuddies, refetch: refetchBuddies } = useQuery({
    queryKey: ['accountability-buddies', activeGroupId, user?.id],
    queryFn: async () => {
      if (!activeGroupId || !user?.id) return [];
      return await getUserBuddies(activeGroupId, user.id);
    },
    enabled: !!activeGroupId && !!user?.id,
  });

  const isAdmin = profile?.user_type === 'admin';

  useEffect(() => {
    if (currentProgram?.start_date) {
      const startDate = new Date(currentProgram.start_date);
      const weekNumber = getCurrentWeekNumber(startDate);
      setCurrentWeekNumber(weekNumber);
    }
  }, [currentProgram]);

  const handleOpenSpotifyPlaylist = () => {
    if (groupData?.spotify_playlist_url) {
      window.open(groupData.spotify_playlist_url, '_blank');
    }
  };

  const refreshBuddies = useCallback(async () => {
    if (!activeGroupId) return;

    setIsGeneratingBuddies(true);
    try {
      await generateWeeklyBuddies(activeGroupId);
      await refetchBuddies();
    } catch (error) {
      console.error('Error refreshing accountability buddies:', error);
    } finally {
      setIsGeneratingBuddies(false);
    }
  }, [activeGroupId, refetchBuddies]);

  const handleTabChange = (newTab: string) => {
    setSearchParams({ tab: newTab }, { replace: true });
  };

  const handleGroupChange = (newGroupId: string) => {
    navigate(`/client-dashboard/moai/${newGroupId}`, { replace: true });
  };

  if (isLoadingGroup || isLoadingProgram || isLoadingUserGroups) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-client dark:text-blue-300" />
      </div>
    );
  }

  if (!activeGroupId && (!userGroups || userGroups.length === 0)) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <p className="text-muted-foreground text-center dark:text-gray-300">No groups found. You aren't assigned to any Moai group yet.</p>
        <p className="text-sm text-muted-foreground text-center dark:text-gray-300">Please contact your coach or administrator.</p>
      </div>
    );
  }

  if (!groupData && activeGroupId) {
     return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-client dark:text-blue-300" />
        <span className="ml-2">Loading group details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groupData && (
        <Card className="border-none shadow-none bg-slate-50 dark:bg-gray-800/50">
          <CardHeader className="text-center py-1 px-4">
            <CardTitle className="text-xl md:text-2xl font-semibold dark:text-white">
              {groupData.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-1 text-center">
            {groupData.spotify_playlist_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSpotifyPlaylist}
                className="bg-white hover:bg-green-50 mb-2 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <Music className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                <span>Team Spotify Playlist</span>
              </Button>
            )}

            {activeGroupId && (
              <AccountabilityBuddyCard
                buddies={buddies || []}
                isAdmin={isAdmin}
                groupId={activeGroupId}
                onRefresh={refreshBuddies}
                loading={isGeneratingBuddies || isLoadingBuddies}
              />
            )}
          </CardContent>
        </Card>
      )}

      {userGroups && userGroups.length > 1 && (
        <div className="flex justify-center mb-2">
          <select
            value={activeGroupId || ''}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="px-2 py-1 border rounded-md text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          >
            {userGroups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 dark:bg-gray-700">
              <TabsTrigger value="progress" className="dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-white">Progress</TabsTrigger>
              <TabsTrigger value="members" className="dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-white">Members</TabsTrigger>
              <TabsTrigger value="coach" className="dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-white">Coach</TabsTrigger>
            </TabsList>

            {user && (
              <div className="px-4 pt-2 pb-1">
                <Button
                  asChild
                  className="w-full flex items-center justify-center gap-2 bg-client hover:bg-client/90 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                  <Link to="/client-dashboard/workouts">
                    <Dumbbell className="h-4 w-4" />
                    Log a Workout
                  </Link>
                </Button>
              </div>
            )}

            <TabsContent value="progress" className="pt-1">
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
