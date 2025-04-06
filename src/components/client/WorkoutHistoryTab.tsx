
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { User, Loader2, FileX } from 'lucide-react';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { format, isFuture, isValid, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Card, CardContent } from '@/components/ui/card';

const WorkoutHistoryTab = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`User timezone in WorkoutHistoryTab: ${userTimeZone}`);
  
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
        Workout History
      </h2>
      
      {clientWorkouts && (
        <div className="mb-2 text-sm text-center text-muted-foreground">
          {clientWorkouts.length} total workouts in your history
        </div>
      )}
      
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
