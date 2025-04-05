import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import WorkoutSetCompletions from './WorkoutSetCompletions';
import { createWorkoutCompletion } from '@/services/workout-history-service';

const ActiveWorkout = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);

  const { data: workout, isLoading: isLoadingWorkout, error: workoutError } = useQuery({
    queryKey: ['workout-details', workoutId],
    queryFn: async () => {
      if (!workoutId) throw new Error('Workout ID is required');

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
        .eq('id', workoutId)
        .maybeSingle();

      if (error || !data) throw error ?? new Error('Workout not found');
      return data;
    },
    enabled: !!workoutId,
  });

  const { data: workoutExercises, isLoading: isLoadingExercises, error: exercisesError } = useQuery({
    queryKey: ['workout-exercises', workoutId],
    queryFn: async () => {
      if (!workoutId) return [];

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
        .eq('workout_id', workoutId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!workoutId,
    staleTime: 300000,
  });

  const { data: existingCompletion, isLoading: isLoadingCompletion } = useQuery({
    queryKey: ['current-workout-completion', workoutId],
    queryFn: async () => {
      if (!workoutId || !user?.id) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('workout_id', workoutId)
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) {
        console.error('Error checking for existing workout completion:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!workoutId && !!user?.id
  });

  const handleBackClick = () => {
    navigate('/client-dashboard/workouts');
  };

  const handleStartWorkout = async () => {
    if (!workoutId || !user?.id) return;
    
    try {
      setStartingWorkout(true);
      
      const data = await createWorkoutCompletion(
        user.id, 
        workoutId, 
        workout?.workout_type || 'strength'
      );
      
      if (!data) {
        toast.error('Failed to start workout');
        setStartingWorkout(false);
        return;
      }
      
      if (window && (window as any).saveTempSetsToWorkoutCompletion) {
        await (window as any).saveTempSetsToWorkoutCompletion(data.id);
      }
      
      toast.success('Workout started!');
      queryClient.invalidateQueries({ queryKey: ['current-workout-completion', workoutId] });
      setStartingWorkout(false);
    } catch (err) {
      console.error('Unexpected error in handleStartWorkout:', err);
      toast.error('Something went wrong');
      setStartingWorkout(false);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workoutId || !user?.id || !existingCompletion?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('workout_completions')
        .update({
          completed_at: new Date().toISOString(),
          workout_type: workout?.workout_type || 'strength'
        })
        .eq('id', existingCompletion.id);

      if (error) {
        console.error('Error logging workout:', error);
        toast.error('Failed to log workout');
        setLoading(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['weekly-run-progress'] });
      toast.success('Workout completed!');
      navigate('/client-dashboard/workouts');
    } catch (err) {
      console.error('Unexpected error in handleCompleteWorkout:', err);
      toast.error('Something went wrong');
      setLoading(false);
    }
  };

  const isLoading = isLoadingWorkout || isLoadingExercises || isLoadingCompletion;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading workout...</p>
      </div>
    );
  }

  if (workoutError || !workout) {
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
              {workoutError?.message?.includes('not found') ? 
                'The requested workout could not be found.' : 
                'There was a problem loading this workout.'}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Error details: {workoutError?.message || 'Unknown error'}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{workout.title || 'Workout'}</CardTitle>
            {workout.description && (
              <p className="text-muted-foreground">{workout.description}</p>
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

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={handleBackClick}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{workout.title}</CardTitle>
          {workout.description && (
            <p className="text-muted-foreground">{workout.description}</p>
          )}
          {workout.week?.week_number && workout.week?.program?.title && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Program:</span> {workout.week.program.title} - Week {workout.week.week_number}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <WorkoutSetCompletions 
            workoutId={workoutId!}
            workoutExercises={workoutExercises || []}
          />
        </CardContent>

        <CardFooter className="flex justify-center">
          {existingCompletion ? (
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
          ) : (
            <Button 
              onClick={handleStartWorkout} 
              disabled={startingWorkout}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {startingWorkout ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Play className="mr-2 h-5 w-5" />
              )}
              Start Workout
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ActiveWorkout;
