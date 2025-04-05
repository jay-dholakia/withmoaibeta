
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import WorkoutSetCompletions from './WorkoutSetCompletions';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  // Improved query with better error handling and network resilience
  const { data: workoutCompletion, isLoading: isLoadingCompletion, error: completionError } = useQuery({
    queryKey: ['workout-completion', workoutCompletionId],
    queryFn: async () => {
      if (!workoutCompletionId) throw new Error('No workout completion ID provided');
      
      console.log(`Fetching workout completion: ${workoutCompletionId}`);
      
      // Use a timeout promise to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000);
      });
      
      const fetchPromise = supabase
        .from('workout_completions')
        .select(`
          *,
          workout:workout_id (
            id,
            title,
            description,
            workout_type
          )
        `)
        .eq('id', workoutCompletionId);
      
      // Race the fetch against the timeout
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.error('Supabase error fetching workout completion:', error);
        throw error;
      }
      
      // Check if any data was returned
      if (!data || data.length === 0) {
        console.error(`Workout completion ${workoutCompletionId} not found`);
        throw new Error(`Workout completion ${workoutCompletionId} not found`);
      }
      
      // Since we queried by ID, we should only have one result
      return data[0];
    },
    enabled: !!workoutCompletionId,
    retry: (count, error) => {
      // Only retry network errors, not 404s or other client errors
      if (count >= 2) return false;
      return error.message?.includes('timeout') || 
             error.message?.includes('network') ||
             error.message?.includes('connection');
    },
    staleTime: 60000, // Cache for 1 minute
  });
  
  // More efficient exercise query with batching and optimizations
  const { data: workoutExercises, isLoading: isLoadingExercises, error: exercisesError } = useQuery({
    queryKey: ['workout-exercises', workoutCompletion?.workout_id],
    queryFn: async () => {
      if (!workoutCompletion?.workout_id) return [];
      
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercise:exercise_id (
            id,
            name,
            description,
            category,
            youtube_link,
            exercise_type,
            log_type
          ),
          superset_group:superset_group_id (
            id,
            title,
            description
          )
        `)
        .eq('workout_id', workoutCompletion.workout_id)
        .order('order_index', { ascending: true });
      
      if (error) {
        console.error('Error fetching workout exercises:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!workoutCompletion?.workout_id,
    staleTime: 300000, // Cache for 5 minutes (workout exercises rarely change)
  });
  
  // Listen for refetch events from other components
  useEffect(() => {
    const handleRefetch = () => {
      queryClient.invalidateQueries({ queryKey: ['workout-set-completions'] });
    };
    
    window.addEventListener('refetch-workout-sets', handleRefetch);
    
    return () => {
      window.removeEventListener('refetch-workout-sets', handleRefetch);
    };
  }, [queryClient]);
  
  const handleBackClick = () => {
    navigate('/client-dashboard/workouts');
  };
  
  const handleCompleteWorkout = async () => {
    if (!workoutCompletionId || !user?.id) return;
    
    try {
      setLoading(true);
      
      // Update the workout completion with completed_at timestamp and ensure workout_type is set
      const { error } = await supabase
        .from('workout_completions')
        .update({
          completed_at: new Date().toISOString(),
          workout_type: workoutCompletion?.workout?.workout_type || workoutCompletion?.workout_type || 'strength'
        })
        .eq('id', workoutCompletionId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error completing workout:', error);
        toast.error('Failed to complete workout');
        setLoading(false);
        return;
      }
      
      // Batch invalidate related queries - this reduces network overhead
      // compared to individual invalidations
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey[0];
          return typeof queryKey === 'string' && (
            queryKey.includes('weekly-run-progress') ||
            queryKey.includes('client-workouts') ||
            queryKey.includes('leaderboard')
          );
        }
      });
      
      toast.success('Workout completed!');
      navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
    } catch (err) {
      console.error('Error in handleCompleteWorkout:', err);
      toast.error('Failed to complete workout');
      setLoading(false);
    }
  };
  
  if (isLoadingCompletion || isLoadingExercises) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading workout...</p>
      </div>
    );
  }
  
  if (completionError || !workoutCompletion) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-amber-500 mr-2" />
              <CardTitle className="text-xl">Workout Not Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {completionError?.message?.includes('not found') ? 
                'The requested workout could not be found.' : 
                'There was a problem loading this workout.'}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Error details: {completionError?.message || 'Unknown error'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleBackClick} className="w-full md:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Workouts
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (exercisesError) {
    return (
      <div className="p-8">
        <Button variant="outline" size="sm" onClick={handleBackClick} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{workoutCompletion.workout?.title || workoutCompletion.title || 'Workout'}</CardTitle>
            {workoutCompletion.workout?.description && (
              <p className="text-muted-foreground">{workoutCompletion.workout.description}</p>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="text-center py-6">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-red-500 mb-2">Error loading exercises for this workout.</p>
              <p className="text-sm text-muted-foreground">
                {exercisesError.message || 'Please try refreshing the page.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const workoutTitle = workoutCompletion.workout?.title || workoutCompletion.title || 'Untitled Workout';
  const workoutDescription = workoutCompletion.workout?.description || workoutCompletion.description || '';
  
  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={handleBackClick}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{workoutTitle}</CardTitle>
          {workoutDescription && (
            <p className="text-muted-foreground">{workoutDescription}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <WorkoutSetCompletions 
            workoutCompletionId={workoutCompletionId!}
            workoutExercises={workoutExercises || []}
          />
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleCompleteWorkout} 
            disabled={loading}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-5 w-5" />
            )}
            Complete Workout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ActiveWorkout;
