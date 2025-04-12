
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { WorkoutProgressCard } from './WorkoutProgressCard';
import { WorkoutType } from './WorkoutTypeIcon';
import { format, isThisWeek } from 'date-fns';
import { detectWorkoutTypeFromText } from '@/services/workout-edit-service';

interface MoaiMemberWeeklyActivityProps {
  userId: string;
  userName: string;
}

const MoaiMemberWeeklyActivity: React.FC<MoaiMemberWeeklyActivityProps> = ({ userId, userName }) => {
  const { user } = useAuth();
  const isCurrentUser = userId === user?.id;
  
  const { data: workouts, isLoading } = useQuery({
    queryKey: ['member-workouts-weekly', userId],
    queryFn: async () => {
      if (isCurrentUser) {
        // Use the client workout history service for current user
        return fetchClientWorkoutHistory(userId);
      } else {
        // Fetch directly from the database for other members
        const { data, error } = await supabase
          .from('workout_completions')
          .select('*, workout:workout_id(*)')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });
          
        if (error) throw error;
        return data;
      }
    },
    enabled: !!userId,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-3">
        <Loader2 className="h-5 w-5 animate-spin text-client" />
      </div>
    );
  }
  
  if (!workouts || workouts.length === 0) {
    return (
      <div className="p-3 text-center">
        <p className="text-sm text-muted-foreground">No workout data available</p>
      </div>
    );
  }
  
  // Process workouts data
  const completedDates: Date[] = [];
  const lifeHappensDates: Date[] = [];
  const typesMap: Record<string, WorkoutType> = {};
  const titlesMap: Record<string, string> = {};
  
  workouts.forEach(workout => {
    if (workout.completed_at) {
      try {
        const completionDate = typeof workout.completed_at === 'string' 
          ? new Date(workout.completed_at) 
          : workout.completed_at;
          
        const dateKey = format(completionDate, 'yyyy-MM-dd');
        
        if (workout.life_happens_pass || workout.rest_day) {
          lifeHappensDates.push(completionDate);
          typesMap[dateKey] = 'rest_day';
          return;
        }
        
        completedDates.push(completionDate);
        
        if (workout.title) {
          titlesMap[dateKey] = workout.title;
        } else if (workout.workout?.title) {
          titlesMap[dateKey] = workout.workout.title;
        }
        
        if (workout.workout_type) {
          typesMap[dateKey] = workout.workout_type as WorkoutType;
        } else if (workout.workout?.workout_type) {
          const type = String(workout.workout.workout_type).toLowerCase();
          if (type.includes('strength')) typesMap[dateKey] = 'strength';
          else if (type.includes('cardio') || type.includes('run')) typesMap[dateKey] = 'cardio';
          else if (type.includes('body') || type.includes('weight')) typesMap[dateKey] = 'bodyweight';
          else if (type.includes('flex') || type.includes('yoga') || type.includes('stretch')) typesMap[dateKey] = 'flexibility';
          else if (type.includes('hiit')) typesMap[dateKey] = 'hiit';
          else if (type.includes('sport')) typesMap[dateKey] = 'sport';
          else if (type.includes('swim')) typesMap[dateKey] = 'swimming';
          else if (type.includes('cycle') || type.includes('bike')) typesMap[dateKey] = 'cycling';
          else if (type.includes('dance')) typesMap[dateKey] = 'dance';
          else if (titlesMap[dateKey]) {
            typesMap[dateKey] = detectWorkoutTypeFromText(titlesMap[dateKey]);
          } else {
            typesMap[dateKey] = 'strength';
          }
        } else if (titlesMap[dateKey]) {
          typesMap[dateKey] = detectWorkoutTypeFromText(titlesMap[dateKey]);
        } else {
          typesMap[dateKey] = 'strength';
        }
      } catch (error) {
        console.error("Error processing workout completion:", error);
      }
    }
  });
  
  // Calculate completed workouts this week
  const completedThisWeek = completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  const lifeHappensThisWeek = lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  // Estimate total workouts (using 6 as default if not available)
  const totalWorkouts = 6;
  
  return (
    <div className="py-2 px-1">
      <WorkoutProgressCard 
        userName={userName}
        completedDates={completedDates}
        lifeHappensDates={lifeHappensDates}
        count={completedThisWeek}
        total={totalWorkouts}
        workoutTypesMap={typesMap}
        workoutTitlesMap={titlesMap}
        isCurrentUser={isCurrentUser}
      />
    </div>
  );
};

export default MoaiMemberWeeklyActivity;
