
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
  
  // First fetch the workout completion to get basic info
  const { data: workoutCompletion, isLoading: isLoadingCompletion, error: completionError } = useQuery({
    queryKey: ['workout-completion', workoutCompletionId],
    queryFn: async () => {
      if (!workoutCompletionId) throw new Error('No workout completion ID provided');
      
      console.log(`Fetching workout completion: ${workoutCompletionId}`);
      
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('id', workoutCompletionId)
        .maybeSingle();
      
      if (error) {
        console.error('Supabase error fetching workout completion:', error);
        throw error;
      }
      
      if (!data) {
        console.error(`Workout completion ${workoutCompletionId} not found`);
        throw new Error(`Workout completion ${workoutCompletionId} not found`);
      }
      
      return data;
    },
    enabled: !!workoutCompletionId,
    retry: (count, error) => {
      if (count >= 2) return false;
      return error.message?.includes('timeout') || 
             error.message?.includes('network') ||
             error.message?.includes('connection');
    }
  });
  
  // Directly get the full workout details from the workouts table
  const { data: workoutDetails, isLoading: isLoadingWorkout, error: workoutError } = useQuery({
    queryKey: ['workout-details', workoutCompletion?.workout_id],
    queryFn: async () => {
      if (!workoutCompletion?.workout_id) return null;
      
      console.log(`Fetching workout details directly from workouts table: ${workoutCompletion.workout_id}`);
      
      // Direct query to the workouts table with full relationship info
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          week:week_id (
            id,
            week_number,
            program:program_id (
              id,
              title,
              description
            )
          )
        `)
        .eq('id', workoutCompletion.workout_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching workout details:', error);
        throw error;
      }
      
      if (!data) {
        console.error(`Workout ${workoutCompletion.workout_id} not found`);
        throw new Error(`Workout not found`);
      }
      
      console.log('Found workout details:', data);
      return data;
    },
    enabled: !!workoutCompletion?.workout_id,
    retry: 2
  });
  
  // Fetch workout exercises directly from the workout_exercises table
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
          workout_type: workoutDetails?.workout_type || workoutCompletion?.workout_type || 'strength'
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
  
  const isLoading = isLoadingCompletion || isLoadingWorkout || isLoadingExercises;
  
  if (isLoading) {
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
  
  if (workoutError || !workoutDetails) {
    return (
      <div className="p-8">
        <Button variant="outline" size="sm" onClick={handleBackClick} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{workoutCompletion.title || 'Workout'}</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="text-center py-6">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-red-500 mb-2">Error loading workout details.</p>
              <p className="text-sm text-muted-foreground">
                {workoutError?.message || 'Could not find this workout in the workouts table. Please refresh or contact your coach.'}
              </p>
            </div>
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
            <CardTitle className="text-xl">{workoutDetails.title || 'Workout'}</CardTitle>
            {workoutDetails.description && (
              <p className="text-muted-foreground">{workoutDetails.description}</p>
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
  
  const workoutTitle = workoutDetails.title || workoutCompletion.title || 'Untitled Workout';
  const workoutDescription = workoutDetails.description || workoutCompletion.description || '';
  
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
          {workoutDetails.week?.week_number && workoutDetails.week?.program?.title && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Program:</span> {workoutDetails.week.program.title} - Week {workoutDetails.week.week_number}
              </p>
            </div>
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
