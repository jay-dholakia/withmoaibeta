import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackWorkoutSet, fetchPersonalRecords } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, Save, HelpCircle } from 'lucide-react';
import { saveWorkoutDraft, getWorkoutDraft, deleteWorkoutDraft, updateExerciseIdInDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { PersonalRecord, Exercise, WorkoutExercise } from '@/types/workout';
import Stopwatch from './Stopwatch';
import { cn } from '@/lib/utils';
import { fetchSimilarExercises } from '@/services/exercise-service';
import { StrengthExercise } from './workout/StrengthExercise';
import { CardioExercise } from './workout/CardioExercise';
import { FlexibilityExercise } from './workout/FlexibilityExercise';
import { RunExercise } from './workout/RunExercise';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});

  const { data: workoutData, isLoading } = useQuery({
    queryKey: ['active-workout', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_completions')
        .select(`*, workout:workout_id (*, workout_exercises (*, exercise:exercise_id (*)))`)
        .eq('id', workoutCompletionId || '')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workoutCompletionId && !!user?.id,
  });

  const workoutExercises = Array.isArray(workoutData?.workout?.workout_exercises)
    ? workoutData.workout.workout_exercises
    : undefined;

  const { exerciseStates, setExerciseStates, sortedExerciseIds } = useWorkoutState(workoutExercises);

  const toggleDescriptionExpanded = (exerciseId: string) => {
    setExpandedDescriptions(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const renderExerciseCard = (exercise: WorkoutExercise) => {
    if (!exerciseStates[exercise.id]) return null;
    const { expanded } = exerciseStates[exercise.id];
    const exerciseName = exercise.exercise?.name || '';

    return (
      <Card key={exercise.id} className="mb-6">
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{exerciseName}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggleDescriptionExpanded(exercise.id)} className="h-8 w-8">
              <ChevronRight className={cn("h-5 w-5 transition-transform", expanded ? "rotate-90" : "")} />
            </Button>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0 px-3 pb-2">
            {/* Exercise content would go here */}
          </CardContent>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-lg font-medium">Loading workout...</p>
      </div>
    );
  }

  if (!workoutData || !workoutData.workout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Workout Not Found</h2>
        <Button onClick={() => navigate('/client-dashboard/workouts')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workouts
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-40">
      <div className="flex items-center mb-4 gap-2">
        <Button variant="ghost" onClick={() => navigate('/client-dashboard/workouts')} className="h-8 w-8 p-0 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{workoutData.workout?.title || "Workout"}</h1>
      </div>

      <Stopwatch className="mt-2 mb-6 fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40" />

      {Array.isArray(workoutExercises) && workoutExercises.length > 0 ? (
        <div className="space-y-6 mb-40">
          {sortedExerciseIds.map(exerciseId => {
            const exercise = workoutExercises.find(ex => ex.id === exerciseId);
            if (!exercise) return null;
            return renderExerciseCard(exercise);
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No Exercises Found</h3>
        </div>
      )}
    </div>
  );
};

export default ActiveWorkout;

