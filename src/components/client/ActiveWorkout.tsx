import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { saveWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { useWorkoutDraft } from '@/hooks/useWorkoutDraft';
import { StrengthExercise } from './workout/StrengthExercise';
import { CardioExercise } from './workout/CardioExercise';
import { FlexibilityExercise } from './workout/FlexibilityExercise';
import { RunExercise } from './workout/RunExercise';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Stopwatch from './Stopwatch';
import { cn } from '@/lib/utils';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);

  const { data: workoutData, isLoading: isWorkoutLoading } = useQuery({
    queryKey: ['active-workout', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_exercises (*, exercise:exercise_id (*))')
        .eq('id', workoutCompletionId || '')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workoutCompletionId && !!user?.id
  });

  const workoutExercises = workoutData?.workout_exercises || [];

  const workoutId = workoutData?.id || workoutCompletionId;

  const { draftData, draftLoaded, isLoading: isDraftLoading } = useWorkoutDraft({
    workoutId,
    onDraftLoaded: () => setDraftApplied(true)
  });

  const {
    exerciseStates,
    setExerciseStates,
    sortedExerciseIds
  } = useWorkoutState(
    initialLoadComplete ? workoutExercises : undefined,
    draftLoaded ? draftData?.exerciseStates : undefined
  );

  useEffect(() => {
    if (workoutData && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [workoutData, initialLoadComplete]);

  const { saveStatus } = useAutosave({
    data: exerciseStates,
    onSave: async (data) => saveWorkoutDraft(workoutId, 'workout', data),
    debounce: 2000,
    minChanges: 1,
    disabled: !workoutId || !exerciseStates || Object.keys(exerciseStates).length === 0
  });

  if (isWorkoutLoading || isDraftLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading workout...</p>
      </div>
    );
  }

  if (!workoutData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Workout not found.</p>
        <Button onClick={() => navigate('/client-dashboard/workouts')} className="mt-4">
          <ArrowLeft className="mr-2" /> Back to Workouts
        </Button>
      </div>
    );
  }

  const renderExerciseCard = (exerciseId: string) => {
    const state = exerciseStates[exerciseId];
    if (!state) return null;

    const currentExercise = state.currentExercise;
    const type = currentExercise?.exercise_type || 'strength';

    if (type === 'strength') {
      return <StrengthExercise key={exerciseId} exerciseId={exerciseId} exerciseState={state} />;
    } else if (type === 'cardio') {
      return <CardioExercise key={exerciseId} exerciseId={exerciseId} exerciseState={state} />;
    } else if (type === 'flexibility') {
      return <FlexibilityExercise key={exerciseId} exerciseId={exerciseId} exerciseState={state} />;
    } else if (type.includes('run')) {
      return <RunExercise key={exerciseId} exerciseId={exerciseId} exerciseState={state} />;
    }

    return null;
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-32">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => navigate('/client-dashboard/workouts')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">{workoutData.title || 'Workout'}</h1>
      </div>

      {sortedExerciseIds.length > 0 ? (
        <div className="space-y-6">
          {sortedExerciseIds.map(renderExerciseCard)}
        </div>
      ) : (
        <div className="text-center py-8">No exercises found for this workout.</div>
      )}

      <div className="fixed bottom-14 left-0 right-0 z-40">
        <div className="bg-gradient-to-t from-background via-background to-transparent">
          <div className="container max-w-2xl mx-auto px-4">
            <Stopwatch saveStatus={saveStatus} />
            <Button
              onClick={() => navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`)}
              className="w-full mt-3 mb-2 py-2 bg-primary text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Workout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkout;
