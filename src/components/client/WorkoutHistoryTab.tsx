
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { User, Loader2, FileX } from 'lucide-react';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { format, isFuture } from 'date-fns';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';
import { Card, CardContent } from '@/components/ui/card';

const WorkoutHistoryTab = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutHistoryItem[]>([]);
  
  // Query for client workouts
  const { data: clientWorkouts, isLoading, error } = useQuery({
    queryKey: ['client-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('Fetching workout history for user:', user.id);
      try {
        const history = await fetchClientWorkoutHistory(user.id);
        console.log(`Fetched ${history.length} workout history items`);
        
        // Log workout types
        const workoutTypes = history.map(item => {
          if (!item.completed_at) return { date: 'unknown', type: 'unknown' };
          
          return {
            date: format(new Date(item.completed_at), 'yyyy-MM-dd'),
            type: item.workout?.workout_type || 'unknown'
          };
        });
        console.log('Workout types in history:', workoutTypes);
        
        return history;
      } catch (err) {
        console.error('Error fetching workout history:', err);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Handle day selection in the calendar
  const handleDaySelect = (date: Date, workouts: WorkoutHistoryItem[]) => {
    if (!date) return;
    
    console.log(`Selected date: ${format(date, 'yyyy-MM-dd')}`);
    console.log(`Found ${workouts.length} workouts for this date`);
    
    workouts.forEach((workout, i) => {
      console.log(`Workout ${i+1}: completed at ${workout.completed_at || 'unknown'}, type: ${workout.workout?.workout_type || 'unknown'}`);
    });
    
    setSelectedDate(date);
    setSelectedWorkouts(workouts);
  };

  // Map workout types to standardized types
  const getStandardizedWorkoutType = (type: string | undefined | null): WorkoutType => {
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
    
    if (clientWorkouts && clientWorkouts.length > 0) {
      clientWorkouts.forEach(item => {
        if (!item.completed_at) return;
        
        try {
          const date = new Date(item.completed_at);
          // Skip future dates or invalid dates
          if (isFuture(date) || isNaN(date.getTime())) return;
          
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
        } catch (err) {
          console.error('Error processing workout date:', err, item.completed_at);
        }
      });
    }
    
    return typesMap;
  }, [clientWorkouts]);

  // Find the most recent workout date to select initially
  useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      try {
        // Sort by completed_at date (newest first)
        const sortedWorkouts = [...clientWorkouts]
          .filter(item => item.completed_at) // Filter out items without completed_at
          .sort((a, b) => {
            if (!a.completed_at) return 1;
            if (!b.completed_at) return -1;
            return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
          });
        
        // If we have any completed workouts, select the most recent one
        if (sortedWorkouts.length > 0) {
          const mostRecentWorkout = sortedWorkouts[0];
          if (mostRecentWorkout.completed_at) {
            const date = new Date(mostRecentWorkout.completed_at);
            
            // Find all workouts on this date
            const workoutsOnDate = clientWorkouts.filter(item => {
              if (!item.completed_at) return false;
              const itemDate = new Date(item.completed_at);
              return itemDate.toDateString() === date.toDateString();
            });
            
            console.log(`Auto-selecting most recent workout date: ${date.toLocaleDateString()} with ${workoutsOnDate.length} workouts`);
            setSelectedDate(date);
            setSelectedWorkouts(workoutsOnDate);
          }
        }
      } catch (err) {
        console.error('Error finding most recent workout:', err);
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
  
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
          <User className="h-5 w-5 text-client" />
          Workout History
        </h2>
        
        <Card className="text-center py-8">
          <CardContent>
            <FileX className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Workout History</h3>
            <p className="text-muted-foreground">
              There was a problem loading your workout history. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientWorkouts || clientWorkouts.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
          <User className="h-5 w-5 text-client" />
          Workout History
        </h2>
        
        <Card className="text-center py-8">
          <CardContent>
            <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Workout History</h3>
            <p className="text-muted-foreground">
              You haven't completed any workouts yet. Get started with your workout plan to see your history here.
            </p>
          </CardContent>
        </Card>
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
