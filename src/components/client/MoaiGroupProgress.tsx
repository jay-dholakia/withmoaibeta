import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';
import { isThisWeek } from 'date-fns';
import { WorkoutProgressCard } from './WorkoutProgressCard';
import { getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { Loader2, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useGroupProgressData } from '@/hooks/useGroupProgressData';
import { getCurrentWeekNumber } from '@/services/assigned-workouts-service';
import { BackgroundFetchIndicator } from './BackgroundFetchIndicator';
import { useFireBadges } from '@/hooks/useFireBadges';
import { supabase } from '@/integrations/supabase/client';
import { useAccountabilityBuddies } from '@/hooks/useAccountabilityBuddies';
import { getCurrentWeekStart } from '@/services/accountability-buddy-service';

interface MoaiGroupProgressProps {
  groupId: string;
  currentProgram?: any; // Program details with start date
}

const MoaiGroupProgress = ({ groupId, currentProgram }: MoaiGroupProgressProps) => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = React.useState<number>(1);
  
  const { 
    groupMembers,
    currentUserProfile,
    currentUserData,
    memberWorkoutsData,
    isLoading,
    isFetchingBackground,
    refreshDataInBackground
  } = useGroupProgressData(groupId);
  
  // Get accountability buddies info
  const {
    buddies,
    loading: loadingBuddies
  } = useAccountabilityBuddies(groupId, user?.id);
  
  // Create a Set of buddy user IDs for quick lookups
  const buddyUserIds = React.useMemo(() => {
    return new Set(buddies.map(buddy => buddy.userId));
  }, [buddies]);
  
  // Get badge counts for current user
  const { badgeCount: currentUserBadgeCount } = useFireBadges(user?.id || '');
  
  // Get badge counts for all group members at once
  const { data: memberBadgeCounts } = useQuery({
    queryKey: ['member-badges', groupId],
    queryFn: async () => {
      if (!groupMembers || groupMembers.length === 0) return {};
      
      const badgeCounts: Record<string, number> = {};
      
      for (const member of groupMembers) {
        if (!member.userId) continue;
        
        try {
          const { data, error } = await supabase
            .rpc('count_user_fire_badges', { user_id_param: member.userId });
            
          if (!error && data !== null) {
            badgeCounts[member.userId] = data;
          }
        } catch (error) {
          console.error(`Error fetching badge count for member ${member.userId}:`, error);
          badgeCounts[member.userId] = 0;
        }
      }
      
      return badgeCounts;
    },
    enabled: !!groupMembers && groupMembers.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get current week number from program start date
  React.useEffect(() => {
    if (currentProgram?.start_date) {
      const startDate = new Date(currentProgram.start_date);
      const weekNumber = getCurrentWeekNumber(startDate);
      setCurrentWeek(weekNumber);
    }
  }, [currentProgram]);
  
  // Fetch assigned workouts count
  const { data: assignedWorkoutsCount } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id, currentWeek],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      try {
        if (currentWeek > 0) {
          return await getWeeklyAssignedWorkoutsCount(user.id, currentWeek);
        }
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 6; // Default to 6 as fallback
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!user?.id,
  });

  // Function to check if a date is this week (using PT timezone)
  const isThisWeekPT = (date: Date) => {
    const ptDateStr = formatInTimeZone(date, 'America/Los_Angeles', 'yyyy-MM-dd');
    const ptDate = new Date(ptDateStr);
    return isThisWeek(ptDate, { weekStartsOn: 1 });
  };
  
  // Helper functions for member display names
  const getDisplayName = (member: any): string => {
    if (member.profileData?.first_name) {
      return member.profileData.first_name;
    }
    return member.email.split('@')[0];
  };
  
  const getCurrentUserDisplayName = (): string => {
    if (currentUserProfile?.first_name) {
      return currentUserProfile.first_name;
    }
    
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return "You";
  };
  
  const completedThisWeek = currentUserData.completedDates.filter(date => isThisWeekPT(date)).length;
  
  const totalWorkouts = assignedWorkoutsCount || 6;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-client mr-2" />
        <p className="text-sm text-muted-foreground">Loading your progress...</p>
      </div>
    );
  }
  
  const allMembers = [
    ...(user ? [{
      userId: user.id,
      email: user.email || '',
      isCurrentUser: true,
      profileData: {
        first_name: currentUserProfile?.first_name || null,
        last_name: currentUserProfile?.last_name || null,
        avatar_url: currentUserProfile?.avatar_url || null
      }
    }] : []),
    ...(groupMembers?.filter(m => !m.isCurrentUser) || [])
  ];
  
  const today = new Date();
  const todayIndex = (today.getDay() === 0 ? 6 : today.getDay() - 1);
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <CardTitle className="text-base font-medium">Weekly Progress</CardTitle>
          <BackgroundFetchIndicator isLoading={isFetchingBackground} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4">
        <div className="ml-11 mb-2">
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
              const isToday = i === todayIndex;
              
              return (
                <div key={`day-${i}`} className={cn(
                  "text-xs text-center px-1 py-0.5",
                  isToday 
                    ? "text-client font-medium" 
                    : "text-muted-foreground"
                )}>
                  <span className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-full",
                    isToday ? "border-2 border-client" : ""
                  )}>
                    {days[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-0.5">
          {allMembers.map((member, index) => {
            const isCurrentUser = member.isCurrentUser;
            const memberData = isCurrentUser 
              ? currentUserData
              : memberWorkoutsData[member.userId];
              
            // Get fire badge count for this member from pre-fetched data
            const memberBadgeCount = isCurrentUser 
              ? currentUserBadgeCount 
              : (memberBadgeCounts?.[member.userId] || 0);
            
            // Check if this member is an accountability buddy for the current user
            const isBuddy = !isCurrentUser && buddyUserIds.has(member.userId);
            
            if (!memberData && !isCurrentUser) {
              return (
                <div key={member.userId} className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 h-6 bg-slate-200 rounded"></div>
                </div>
              );
            }
            
            const memberCompletedThisWeek = isCurrentUser
              ? completedThisWeek
              : (memberData?.completedDates || []).filter(date => isThisWeekPT(date)).length;
            
            return (
              <div key={member.userId}>
                <WorkoutProgressCard 
                  completedDates={isCurrentUser ? currentUserData.completedDates : memberData?.completedDates || []}
                  lifeHappensDates={isCurrentUser ? currentUserData.lifeHappensDates : memberData?.lifeHappensDates || []}
                  count={memberCompletedThisWeek}
                  total={totalWorkouts}
                  workoutTypesMap={isCurrentUser ? currentUserData.workoutTypesMap : memberData?.workoutTypesMap || {}}
                  workoutTitlesMap={isCurrentUser ? currentUserData.workoutTitlesMap : memberData?.workoutTitlesMap || {}}
                  userName={isCurrentUser ? getCurrentUserDisplayName() : getDisplayName(member)}
                  isCurrentUser={isCurrentUser}
                  avatarUrl={member.profileData?.avatar_url}
                  firstName={member.profileData?.first_name}
                  lastName={member.profileData?.last_name}
                  showLabelsBelow={false}
                  className={cn(
                    "py-1", 
                    isBuddy ? "bg-green-100 dark:bg-green-900/40 rounded-md px-2 -mx-2" : ""
                  )}
                  fireWeeks={memberBadgeCount}
                  isBuddy={isBuddy}
                />
                {index < allMembers.length - 1 && (
                  <div className="py-1">
                    <Separator className="opacity-30" />
                  </div>
                )}
              </div>
            );
          })}
          
          {(!allMembers || allMembers.length === 0) && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No group members found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoaiGroupProgress;
