
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { User, Loader2 } from 'lucide-react';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { format } from 'date-fns';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';

const WorkoutHistoryTab = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutHistoryItem[]>([]);
  
  // Query for client workouts
  const { data: clientWorkouts, isLoading } = useQuery({
    queryKey: ['client-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('Fetching workout history for user:', user.id);
      const history = await fetchClientWorkoutHistory(user.id);
      console.log(`Fetched ${history.length} workout history items`);
      
      // Log workout types
      const workoutTypes = history.map(item => {
        return {
          date: format(new Date(item.completed_at), 'yyyy-MM-dd'),
          type: item.workout?.workout_type || 'unknown'
        };
      });
      console.log('Workout types in history:', workoutTypes);
      
      return history;
    },
    enabled: !!user?.id,
  });

  // Handle day selection in the calendar
  const handleDaySelect = (date: Date, workouts: WorkoutHistoryItem[]) => {
    console.log(`Selected date: ${format(date, 'yyyy-MM-dd')}`);
    console.log(`Found ${workouts.length} workouts for this date`);
    
    workouts.forEach((workout, i) => {
      console.log(`Workout ${i+1}: completed at ${workout.completed_at}, type: ${workout.workout?.workout_type || 'unknown'}`);
    });
    
    setSelectedDate(date);
    setSelectedWorkouts(workouts);
  };

  // Map workout types to standardized types
  const getStandardizedWorkoutType = (type: string): WorkoutType => {
    if (!type) return 'strength';
    
    type = type.toLowerCase();
    
    if (type.includes('strength')) return 'strength';
    if (type.includes('body') || type.includes('weight')) return 'bodyweight';
    if (type.includes('cardio') || type.includes('run') || type.includes('hiit')) return 'cardio';
    if (type.includes('flex') || type.includes('yoga') || type.includes('stretch') || type.includes('recovery')) return 'flexibility';
    if (type.includes('rest')) return 'rest_day';
    if (type.includes('custom')) return 'custom';
    if (type.includes('one')) return 'one_off';
    
    return 'strength'; // Default fallback
  };

  // Create a map of dates to workout types
  const workoutTypesMap = React.useMemo(() => {
    const typesMap: Record<string, WorkoutType> = {};
    
    if (clientWorkouts) {
      clientWorkouts.forEach(item => {
        if (!item.completed_at) return;
        
        const date = new Date(item.completed_at);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (item.life_happens_pass || item.rest_day) {
          typesMap[dateKey] = 'rest_day';
          return;
        }
        
        if (item.workout?.workout_type) {
          typesMap[dateKey] = getStandardizedWorkoutType(item.workout.workout_type);
          return;
        }
        
        // Fallback to checking workout title
        const title = item.workout?.title?.toLowerCase() || '';
        typesMap[dateKey] = getStandardizedWorkoutType(title);
      });
    }
    
    return typesMap;
  }, [clientWorkouts]);

  // Initially select March 26, 2025 if workouts are loaded
  useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      const march26 = new Date(2025, 2, 26); // March 26, 2025
      
      // Filter workouts for March 26
      const march26Workouts = clientWorkouts.filter(item => {
        const date = new Date(item.completed_at);
        return date.getFullYear() === 2025 && 
               date.getMonth() === 2 && 
               date.getDate() === 26;
      });
      
      if (march26Workouts.length > 0) {
        console.log(`Auto-selecting March 26, 2025 with ${march26Workouts.length} workouts`);
        setSelectedDate(march26);
        setSelectedWorkouts(march26Workouts);
      }
    }
  }, [clientWorkouts]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-client" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
        <User className="h-5 w-5 text-client" />
        Monthly Progress
      </h2>
      
      {clientWorkouts && (
        <div className="mb-2 text-sm text-center text-muted-foreground">
          {clientWorkouts.length} total workouts in your history
        </div>
      )}
      
      <MonthlyCalendarView 
        workouts={clientWorkouts || []} 
        onDaySelect={handleDaySelect}
        workoutTypesMap={workoutTypesMap}
      />
      
      <h2 className="text-xl font-bold mb-4 mt-8 flex items-center justify-center gap-2">
        <User className="h-5 w-5 text-client" />
        Workout Details
      </h2>
      
      <WorkoutDayDetails 
        date={selectedDate}
        workouts={selectedWorkouts}
      />
    </div>
  );
};

export default WorkoutHistoryTab;
