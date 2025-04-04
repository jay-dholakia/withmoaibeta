import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { User, Loader2, FileX, CalendarDays } from 'lucide-react';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { format, isFuture, isValid, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { WorkoutType, WorkoutTypeIcon } from '@/components/client/WorkoutTypeIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const WorkoutHistoryTab = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  const { data: clientWorkouts, isLoading, error, refetch } = useQuery({
    queryKey: ['client-workouts', user?.id, refreshKey],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('Fetching workout history for user:', user.id);
      try {
        const history = await fetchClientWorkoutHistory(user.id);
        console.log(`Fetched ${history.length} workout history items`);
        
        const workoutTypes = history.map(item => {
          if (!item.completed_at) return { date: 'unknown', type: 'unknown' };
          
          try {
            const date = new Date(item.completed_at);
            return {
              date: isValid(date) ? format(date, 'yyyy-MM-dd') : 'invalid-date',
              type: item.workout?.workout_type || item.workout_type || 'unknown'
            };
          } catch (err) {
            console.error('Error formatting date:', err, item.completed_at);
            return { date: 'error', type: 'unknown' };
          }
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

  const handleDaySelect = (date: Date, workouts: WorkoutHistoryItem[]) => {
    if (!date || !isValid(date)) {
      console.error('Invalid date selected:', date);
      return;
    }
    
    try {
      console.log(`Selected date: ${format(date, 'yyyy-MM-dd')}`);
      console.log(`Found ${workouts.length} workouts for this date`);
      
      workouts.forEach((workout, i) => {
        console.log(`Workout ${i+1}: completed at ${workout.completed_at || 'unknown'}, type: ${workout.workout?.workout_type || workout.workout_type || 'unknown'}`);
      });
      
      setSelectedDate(date);
      setSelectedWorkouts(workouts);
    } catch (err) {
      console.error('Error in handleDaySelect:', err);
      setSelectedDate(date);
      setSelectedWorkouts(workouts || []);
    }
  };

  const getStandardizedWorkoutType = (type: string | undefined | null): WorkoutType => {
    if (!type) return 'strength';
    
    type = type.toLowerCase();
    
    // Check for sport-related terms first to prioritize them
    if (type.includes('sport') || 
        type.includes('game') || 
        type.includes('match') || 
        type.includes('tennis') || 
        type.includes('ball') || 
        type.includes('soccer') || 
        type.includes('football') || 
        type.includes('basketball') || 
        type.includes('baseball')) return 'sport';
    
    if (type.includes('strength')) return 'strength';
    if (type.includes('body') || type.includes('weight')) return 'bodyweight';
    if (type.includes('cardio') || type.includes('run') || type.includes('hiit')) return 'cardio';
    if (type.includes('flex') || type.includes('yoga') || type.includes('stretch') || type.includes('recovery')) return 'flexibility';
    if (type.includes('rest')) return 'rest_day';
    if (type.includes('custom')) return 'custom';
    if (type.includes('one')) return 'one_off';
    if (type.includes('dance')) return 'dance';
    if (type.includes('swim')) return 'swimming';
    if (type.includes('cycl') || type.includes('bike')) return 'cycling';
    if (type.includes('hiit')) return 'hiit';
    
    return 'strength'; // Default fallback
  };

  const workoutTypesMap = React.useMemo(() => {
    const typesMap: Record<string, WorkoutType> = {};
    
    if (clientWorkouts && clientWorkouts.length > 0) {
      clientWorkouts.forEach(item => {
        if (!item.completed_at) return;
        
        try {
          const date = new Date(item.completed_at);
          if (!isValid(date) || isFuture(date)) return;
          
          const dateKey = format(date, 'yyyy-MM-dd');
          
          if (item.life_happens_pass || item.rest_day) {
            typesMap[dateKey] = 'rest_day';
            return;
          }
          
          // Check for direct workout_type on the item
          if (item.workout_type) {
            typesMap[dateKey] = getStandardizedWorkoutType(item.workout_type);
            return;
          }
          
          // Check for workout_type inside the workout object
          if (item.workout?.workout_type) {
            typesMap[dateKey] = getStandardizedWorkoutType(item.workout.workout_type);
            return;
          }
          
          // Check title for clues
          const title = item.title?.toLowerCase() || item.workout?.title?.toLowerCase() || '';
          if (title) {
            // Check directly for specific activities in the title
            if (title.includes('tennis') || 
                title.includes('soccer') || 
                title.includes('football') || 
                title.includes('basketball') || 
                title.includes('baseball') || 
                title.includes('volleyball') || 
                title.includes('frisbee') || 
                title.includes('golf') ||
                title.includes('game') ||
                title.includes('match') ||
                title.includes('play')) {
              typesMap[dateKey] = 'sport';
              return;
            }
            
            typesMap[dateKey] = getStandardizedWorkoutType(title);
            return;
          }
          
          // Fallback to a default
          typesMap[dateKey] = 'custom';
        } catch (err) {
          console.error('Error processing workout date:', err, item.completed_at);
        }
      });
    }
    
    return typesMap;
  }, [clientWorkouts]);

  useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      try {
        const sortedWorkouts = [...clientWorkouts]
          .filter(item => item.completed_at)
          .sort((a, b) => {
            if (!a.completed_at) return 1;
            if (!b.completed_at) return -1;
            
            try {
              const dateA = new Date(a.completed_at);
              const dateB = new Date(b.completed_at);
              
              if (!isValid(dateA)) return 1;
              if (!isValid(dateB)) return -1;
              
              return dateB.getTime() - dateA.getTime();
            } catch (err) {
              console.error('Error comparing dates:', err);
              return 0;
            }
          });
        
        if (sortedWorkouts.length > 0) {
          const mostRecentWorkout = sortedWorkouts[0];
          if (mostRecentWorkout.completed_at) {
            try {
              const date = new Date(mostRecentWorkout.completed_at);
              
              if (isValid(date)) {
                const workoutsOnDate = clientWorkouts.filter(item => {
                  if (!item.completed_at) return false;
                  
                  try {
                    const itemDate = new Date(item.completed_at);
                    return isValid(itemDate) && itemDate.toDateString() === date.toDateString();
                  } catch {
                    return false;
                  }
                });
                
                console.log(`Auto-selecting most recent workout date: ${date.toLocaleDateString()} with ${workoutsOnDate.length} workouts`);
                setSelectedDate(date);
                setSelectedWorkouts(workoutsOnDate);
              } else {
                console.error('Invalid date from completed_at:', mostRecentWorkout.completed_at);
                setSelectedDate(new Date());
                setSelectedWorkouts([]);
              }
            } catch (err) {
              console.error('Error processing most recent workout date:', err);
              setSelectedDate(new Date());
              setSelectedWorkouts([]);
            }
          }
        }
      } catch (err) {
        console.error('Error finding most recent workout:', err);
      }
    }
  }, [clientWorkouts]);
  
  // Get current week workouts
  const currentWeekWorkouts = React.useMemo(() => {
    if (!clientWorkouts || clientWorkouts.length === 0) return [];
    
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    
    return clientWorkouts.filter(workout => {
      if (!workout.completed_at) return false;
      
      try {
        const completedDate = parseISO(workout.completed_at);
        return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
      } catch {
        return false;
      }
    }).sort((a, b) => {
      // Sort by date first
      const dateA = parseISO(a.completed_at);
      const dateB = parseISO(b.completed_at);
      const dateDiff = dateB.getTime() - dateA.getTime();
      
      if (dateDiff !== 0) return dateDiff;
      
      // If same date, sort by title
      const titleA = a.title || a.workout?.title || '';
      const titleB = b.title || b.workout?.title || '';
      return titleA.localeCompare(titleB);
    });
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
      {/* Weekly Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
          <CalendarDays className="h-5 w-5 text-client" />
          This Week's Workouts
        </h2>
        
        {currentWeekWorkouts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">No workouts completed this week yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {currentWeekWorkouts.map((workout) => {
              const completedDate = parseISO(workout.completed_at);
              const dayOfWeek = format(completedDate, 'EEE');
              const workoutType = workout.workout_type || 
                                  workout.workout?.workout_type || 
                                  (workout.rest_day ? 'rest_day' : 'strength');
              const workoutTitle = workout.title || 
                                  workout.workout?.title || 
                                  (workout.rest_day ? 'Rest Day' : 'Custom Workout');
              
              return (
                <Card key={workout.id} className="overflow-hidden">
                  <CardHeader className="px-4 py-3 pb-2 flex flex-row items-center space-y-0">
                    <div className="flex items-center space-x-2">
                      <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium">
                        {dayOfWeek}
                      </div>
                      <CardTitle className="text-lg line-clamp-1">{workoutTitle}</CardTitle>
                    </div>
                    <div className="ml-auto">
                      <WorkoutTypeIcon type={workoutType as WorkoutType} size="sm" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 py-2">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        {format(completedDate, 'MMM d, yyyy')}
                      </div>
                      {workout.duration && (
                        <Badge variant="outline" className="text-xs">
                          {workout.duration} min
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
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
      
      <button 
        className="hidden" 
        onClick={() => {
          refetch(); 
          console.log('Refreshing workout history data');
        }}
        id="refresh-workout-history"
      />
    </div>
  );
};

export default WorkoutHistoryTab;
