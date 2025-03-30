import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { useQuery } from '@tanstack/react-query';
import { isThisWeek, format } from 'date-fns';
import { WorkoutType } from './WorkoutTypeIcon';
import { WorkoutProgressCard } from './WorkoutProgressCard';
import { getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';

interface MoaiGroupProgressProps {
  groupId: string;
}

const MoaiGroupProgress = ({ groupId }: MoaiGroupProgressProps) => {
  const { user } = useAuth();
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [lifeHappensDates, setLifeHappensDates] = useState<Date[]>([]);
  const [workoutTypesMap, setWorkoutTypesMap] = useState<Record<string, WorkoutType>>({});
  
  // Query for assigned workout count
  const { data: assignedWorkoutsCount } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      try {
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        if (count <= 0) return 5; // Default to 5 if no assigned workouts
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 5; // Default to 5 as fallback
      }
    },
    enabled: !!user?.id,
  });
  
  // Query client workouts
  const { data: clientWorkouts, isLoading } = useQuery({
    queryKey: ['client-workouts-moai', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id,
  });
  
  // Extract completed dates, life happens dates, and workout types
  useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      const newCompletedDates: Date[] = [];
      const newLifeHappensDates: Date[] = [];
      const newWorkoutTypesMap: Record<string, WorkoutType> = {};
      
      clientWorkouts.forEach(workout => {
        if (workout.completed_at) {
          const completionDate = typeof workout.completed_at === 'string' 
            ? new Date(workout.completed_at) 
            : workout.completed_at;
            
          const dateKey = format(completionDate, 'yyyy-MM-dd');
          
          if (workout.life_happens_pass || workout.rest_day) {
            newLifeHappensDates.push(completionDate);
            return;
          }
          
          newCompletedDates.push(completionDate);
          
          // Determine workout type
          if (workout.workout?.workout_type) {
            const type = String(workout.workout.workout_type).toLowerCase();
            if (type.includes('strength')) newWorkoutTypesMap[dateKey] = 'strength';
            else if (type.includes('cardio')) newWorkoutTypesMap[dateKey] = 'cardio';
            else if (type.includes('body')) newWorkoutTypesMap[dateKey] = 'bodyweight';
            else if (type.includes('flex')) newWorkoutTypesMap[dateKey] = 'flexibility';
            else newWorkoutTypesMap[dateKey] = 'strength';
          } else {
            newWorkoutTypesMap[dateKey] = 'strength';
          }
        }
      });
      
      setCompletedDates(newCompletedDates);
      setLifeHappensDates(newLifeHappensDates);
      setWorkoutTypesMap(newWorkoutTypesMap);
    }
  }, [clientWorkouts]);
  
  // Count workouts completed this week
  const completedThisWeek = completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  // Count life happens passes used this week
  const lifeHappensThisWeek = lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  // Total completed including life happens
  const totalCompletedThisWeek = completedThisWeek + lifeHappensThisWeek;
  
  const totalWorkouts = assignedWorkoutsCount || 5; // Default to 5 if undefined
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-sm text-muted-foreground">Loading your progress...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {user && (
        <WorkoutProgressCard 
          label="Your Workouts"
          completedDates={completedDates}
          lifeHappensDates={lifeHappensDates}
          count={totalCompletedThisWeek}
          total={totalWorkouts}
          workoutTypesMap={workoutTypesMap}
          userName={user.email?.split('@')[0] || 'You'}
          isCurrentUser={true}
        />
      )}
      
      {/* TODO: Add other group members progress cards here */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        Other group members' progress will appear here soon.
      </p>
    </div>
  );
};

export default MoaiGroupProgress;
