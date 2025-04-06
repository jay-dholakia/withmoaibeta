import React, { useMemo, useState } from 'react';
import { Container } from '@/components/ui/container';
import { CoachMessageCard } from '@/components/client/CoachMessageCard';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { format, isThisWeek, startOfWeek, endOfWeek } from 'date-fns';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';
import { getWeeklyAssignedWorkoutsCount, countCompletedWorkoutsForWeek } from '@/services/workout-history-service';
import { fetchClientProfile } from '@/services/client-service';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { detectWorkoutTypeFromText } from '@/services/workout-edit-service';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutHistoryItem } from '@/types/workout';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutHistoryItem[]>([]);
  
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await fetchClientProfile(user.id);
      } catch (error) {
        console.error('Error fetching client profile:', error);
        return null;
      }
    },
    enabled: !!user?.id,
  });
  
  const { data: clientWorkouts, isLoading: isLoadingWorkouts, error: workoutsError } = useQuery({
    queryKey: ['client-workouts-leaderboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await fetchClientWorkoutHistory(user.id);
      } catch (error) {
        console.error('Error fetching client workout history:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });
  
  const { data: assignedWorkoutsCount, isLoading: isLoadingCount, error: countError } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 5; // Default to 5 if user ID not available
      try {
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        if (!count || count <= 0) return 5; // Default to 5 if no assigned workouts
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 5; // Default fallback
      }
    },
    enabled: !!user?.id,
  });
  
  const { data: completedThisWeek, isLoading: isLoadingCompleted, error: completedError } = useQuery({
    queryKey: ['completed-workouts-this-week', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      try {
        const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
        return await countCompletedWorkoutsForWeek(user.id, monday);
      } catch (error) {
        console.error("Error counting completed workouts:", error);
        return 0;
      }
    },
    enabled: !!user?.id,
  });
  
  const { completedDates, lifeHappensDates, workoutTypesMap, workoutTitlesMap } = useMemo(() => {
    const completed: Date[] = [];
    const lifeHappens: Date[] = [];
    const typesMap: Record<string, WorkoutType> = {};
    const titleMap: Record<string, string> = {};
    
    if (clientWorkouts && Array.isArray(clientWorkouts) && clientWorkouts.length > 0) {
      clientWorkouts.forEach(item => {
        if (!item.completed_at) return;
        
        const completionDate = typeof item.completed_at === 'string' 
          ? new Date(item.completed_at) 
          : item.completed_at;
          
        if (!completionDate) return;
        
        const dateKey = format(completionDate, 'yyyy-MM-dd');
        
        if (item.life_happens_pass || item.rest_day) {
          lifeHappens.push(completionDate);
          typesMap[dateKey] = 'rest_day';
          return;
        }
        
        completed.push(completionDate);
        
        if (item.title) {
          titleMap[dateKey] = item.title;
        } else if (item.workout?.title) {
          titleMap[dateKey] = item.workout.title;
        }
        
        if (item.workout_type) {
          typesMap[dateKey] = item.workout_type as WorkoutType;
        } else if (item.workout?.workout_type) {
          const type = String(item.workout.workout_type).toLowerCase();
          if (type.includes('strength')) typesMap[dateKey] = 'strength';
          else if (type.includes('cardio') || type.includes('run')) typesMap[dateKey] = 'cardio';
          else if (type.includes('body') || type.includes('weight')) typesMap[dateKey] = 'bodyweight';
          else if (type.includes('flex') || type.includes('yoga') || type.includes('stretch')) typesMap[dateKey] = 'flexibility';
          else if (type.includes('rest')) typesMap[dateKey] = 'rest_day';
          else if (type.includes('custom')) typesMap[dateKey] = 'custom';
          else if (type.includes('one')) typesMap[dateKey] = 'one_off';
          else if (type.includes('hiit')) typesMap[dateKey] = 'hiit';
          else if (type.includes('sport')) typesMap[dateKey] = 'sport';
          else if (type.includes('swim')) typesMap[dateKey] = 'swimming';
          else if (type.includes('cycle') || type.includes('bike')) typesMap[dateKey] = 'cycling';
          else if (type.includes('dance')) typesMap[dateKey] = 'dance';
          else {
            if (titleMap[dateKey]) {
              typesMap[dateKey] = detectWorkoutTypeFromText(titleMap[dateKey]);
            } else {
              typesMap[dateKey] = 'strength';
            }
          }
        } else if (titleMap[dateKey]) {
          typesMap[dateKey] = detectWorkoutTypeFromText(titleMap[dateKey]);
        } else {
          typesMap[dateKey] = 'strength';
        }
      });
    }
    
    return { 
      completedDates: completed, 
      lifeHappensDates: lifeHappens, 
      workoutTypesMap: typesMap,
      workoutTitlesMap: titleMap 
    };
  }, [clientWorkouts]);
  
  const lifeHappensThisWeek = useMemo(() => {
    if (!lifeHappensDates.length) return 0;
    
    return lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  }, [lifeHappensDates]);
  
  const totalCompletedCount = completedThisWeek || 0;
  
  const totalWorkouts = assignedWorkoutsCount || 5;
  
  const userDisplayName = profile?.first_name || (user?.email ? user.email.split('@')[0] : 'You');
  
  const isLoading = isLoadingProfile || isLoadingWorkouts || isLoadingCount || isLoadingCompleted;
  
  const handleDaySelect = (date: Date, workouts: WorkoutHistoryItem[]) => {
    setSelectedDate(date);
    setSelectedWorkouts(workouts || []);
  };
  
  React.useEffect(() => {
    if (profileError) {
      console.error('Profile error:', profileError);
      toast.error('Failed to load profile information');
    }
    
    if (workoutsError) {
      console.error('Workouts error:', workoutsError);
      toast.error('Failed to load workout history');
    }
    
    if (countError || completedError) {
      console.error('Count/completed error:', countError || completedError);
      toast.error('Failed to load workout progress data');
    }
  }, [profileError, workoutsError, countError, completedError]);
  
  if (isLoading) {
    return (
      <Container className="px-4 sm:px-4 mx-auto w-full max-w-screen-md">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-client" />
          <span className="ml-2">Loading your progress...</span>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="px-0 sm:px-4 mx-auto w-full max-w-screen-md">
      <div className="w-full">
        {user && <CoachMessageCard userId={user.id} />}
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-center">Monthly Workout Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyCalendarView 
              workouts={clientWorkouts || []}
              onDaySelect={handleDaySelect}
              workoutTypesMap={workoutTypesMap}
              showWorkoutTooltips={true}
              workoutTitlesMap={workoutTitlesMap}
            />
            
            <div className="mt-8">
              <WorkoutDayDetails
                date={selectedDate}
                workouts={selectedWorkouts}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default LeaderboardPage;
