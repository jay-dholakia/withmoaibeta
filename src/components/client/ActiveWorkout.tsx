import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, HelpCircle } from 'lucide-react';
import { useWorkoutDraft } from '@/hooks/useWorkoutDraft';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import Stopwatch from './Stopwatch';
import { cn } from '@/lib/utils';
import { StrengthExercise } from './workout/StrengthExercise';
import { CardioExercise } from './workout/CardioExercise';
import { FlexibilityExercise } from './workout/FlexibilityExercise';
import { RunExercise } from './workout/RunExercise';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  const { data: workoutData, isLoading } = useQuery({
    queryKey: ['active-workout', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*, workout:workout_id(*, workout_exercises(*, exercise:exercise_id(*)))')
        .eq('id', workoutCompletionId || '')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workoutCompletionId && !!user?.id,
    staleTime: 30000,
  });

  const workoutExercises = workoutData?.workout?.workout_exercises || [];
  const workoutId = workoutData?.workout?.id || workoutCompletionId;

  const { draftData, draftLoaded, isLoading: isDraftLoading } = useWorkoutDraft({
    workoutId,
  });

  const { exerciseStates, setExerciseStates } = useWorkoutState(
    workoutExercises,
    draftLoaded ? draftData?.exerciseStates : undefined
  );

  const toggleDescriptionExpanded = (exerciseId: string) => {
    setExpandedDescriptions(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  if (isLoading || isDraftLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-lg font-medium">Loading workout...</p>
      </div>
    );
  }

  if (!workoutExercises.length) {
    return (
      <div className="text-center py-8">
        <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">No Exercises Found</h3>
        <p className="text-muted-foreground">This workout doesn't have any exercises.</p>
        <Button onClick={() => navigate('/client-dashboard/workouts')} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workouts
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-32">
      <div className="flex items-center mb-4 gap-2">
        <Button variant="ghost" onClick={() => navigate('/client-dashboard/workouts')} className="h-8 w-8 p-0 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{workoutData.workout?.title || 'Workout'}</h1>
      </div>

      <div className="space-y-6">
        {workoutExercises.map((exercise) => {
          const state = exerciseStates?.[exercise.id];
          const currentExercise = state?.currentExercise || exercise.exercise;
          const exerciseName = currentExercise?.name || '';
          const exerciseType = currentExercise?.exercise_type || 'strength';
          const description = currentExercise?.description || '';

          return (
            <Card key={exercise.id} className="mb-6">
              <CardHeader className="p-3">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">{exerciseName}</CardTitle>
                    {description && !expandedDescriptions[exercise.id] && (
                      <CardDescription className="mt-1 text-xs line-clamp-2">{description}</CardDescription>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => toggleDescriptionExpanded(exercise.id)} className="h-8 w-8">
                    <ChevronRight className={cn('h-5 w-5 transition-transform', expandedDescriptions[exercise.id] ? 'rotate-90' : '')} />
                  </Button>
                </div>
              </CardHeader>
              {expandedDescriptions[exercise.id] && (
                <CardContent className="pt-0 px-3 pb-2">
                  <div className="mb-4 text-sm rounded-md bg-muted/50 p-3">{description}</div>
                  {exerciseType === 'strength' && <StrengthExercise exercise={exercise} exerciseState={state} />}
                  {exerciseType === 'cardio' && <CardioExercise exercise={exercise} exerciseState={state} />}
                  {exerciseType === 'flexibility' && <FlexibilityExercise exercise={exercise} exerciseState={state} />}
                  {(exerciseName.toLowerCase().includes('run') || exerciseName.toLowerCase().includes('running')) && <RunExercise exercise={exercise} exerciseState={state} />}
                </CardContent>
              )}
            </Card>
          );
        })}

        <div className="fixed bottom-14 left-0 right-0 z-40">
          <div className="bg-gradient-to-t from-background via-background to-transparent">
            <div className="container max-w-2xl mx-auto px-4">
              <Stopwatch className="border-b border-border" saveStatus="saved" />
              <Button onClick={() => setIsCompletionDialogOpen(true)} className="w-full mt-3 mb-2 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg shadow-sm">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Workout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Workout</DialogTitle>
            <DialogDescription>Are you sure you want to mark this workout as complete?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`)} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
