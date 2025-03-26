import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackWorkoutSet } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [exerciseStates, setExerciseStates] = useState<{
    [key: string]: {
      expanded: boolean;
      sets: Array<{
        setNumber: number;
        weight: string;
        reps: string;
        completed: boolean;
      }>;
    };
  }>({});

  const { data: workoutData, isLoading } = useQuery({
    queryKey: ['active-workout', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_completions')
        .select(`
          *,
          workout:workout_id (
            *,
            workout_exercises (
              *,
              exercise:exercise_id (*)
            )
          ),
          workout_set_completions (*)
        `)
        .eq('id', workoutCompletionId || '')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!workoutCompletionId && !!user?.id,
  });

  const trackSetMutation = useMutation({
    mutationFn: async ({
      exerciseId,
      setNumber,
      weight,
      reps,
    }: {
      exerciseId: string;
      setNumber: number;
      weight: string;
      reps: string;
    }) => {
      if (!workoutCompletionId) return null;
      return trackWorkoutSet(
        workoutCompletionId,
        exerciseId,
        setNumber,
        weight ? parseFloat(weight) : null,
        reps ? parseInt(reps, 10) : null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-workout', workoutCompletionId] });
    },
    onError: (error) => {
      console.error('Error tracking set:', error);
      toast.error('Failed to save set');
    },
  });

  useEffect(() => {
    if (workoutData?.workout?.workout_exercises) {
      const initialState: any = {};
      
      const workoutExercises = Array.isArray(workoutData.workout.workout_exercises) 
        ? workoutData.workout.workout_exercises 
        : [];
      
      workoutExercises.forEach((exercise: any) => {
        const sets = Array.from({ length: exercise.sets }, (_, i) => {
          const existingSet = workoutData.workout_set_completions?.find(
            (set: any) => set.workout_exercise_id === exercise.id && set.set_number === i + 1
          );
          
          return {
            setNumber: i + 1,
            weight: existingSet?.weight?.toString() || '',
            reps: existingSet?.reps_completed?.toString() || '',
            completed: !!existingSet?.completed,
          };
        });
        
        initialState[exercise.id] = {
          expanded: true,
          sets,
        };
      });
      
      setExerciseStates(initialState);
    }
  }, [workoutData]);

  const handleSetChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        sets: prev[exerciseId].sets.map((set, idx) => 
          idx === setIndex ? { ...set, [field]: value } : set
        ),
      },
    }));
  };

  const handleSetCompletion = async (exerciseId: string, setIndex: number, completed: boolean) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        sets: prev[exerciseId].sets.map((set, idx) => 
          idx === setIndex ? { ...set, completed } : set
        ),
      },
    }));

    if (completed) {
      const set = exerciseStates[exerciseId].sets[setIndex];
      await trackSetMutation.mutateAsync({
        exerciseId,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
      });
    }
  };

  const toggleExerciseExpanded = (exerciseId: string) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        expanded: !prev[exerciseId].expanded,
      },
    }));
  };

  const isWorkoutComplete = () => {
    if (!workoutData?.workout?.workout_exercises || !exerciseStates) return false;
    
    const workoutExercises = Array.isArray(workoutData.workout.workout_exercises) 
      ? workoutData.workout.workout_exercises 
      : [];
    
    return workoutExercises.every((exercise: any) => {
      const exerciseState = exerciseStates[exercise.id];
      if (!exerciseState) return false;
      
      return exerciseState.sets.every((set) => set.completed);
    });
  };

  const finishWorkout = () => {
    navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }

  if (!workoutData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-medium mb-2">Workout Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The workout you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate('/client-dashboard/workouts')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
        </Button>
      </div>
    );
  }

  const workoutExercises = Array.isArray(workoutData.workout.workout_exercises) 
    ? workoutData.workout.workout_exercises 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/client-dashboard/workouts')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{workoutData.workout.title}</h1>
          <p className="text-muted-foreground">Track your progress</p>
        </div>
      </div>

      <div className="space-y-4">
        {workoutExercises.map((exercise: any) => (
          <Card key={exercise.id} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer bg-client/5" 
              onClick={() => toggleExerciseExpanded(exercise.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">{exercise.exercise.name}</CardTitle>
                  <CardDescription>
                    {exercise.sets} sets • {exercise.reps} reps
                    {exercise.rest_seconds ? ` • ${exercise.rest_seconds}s rest` : ''}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {exerciseStates[exercise.id]?.sets.every(set => set.completed) && (
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                  )}
                  <ChevronRight 
                    className={`h-5 w-5 transition-transform ${
                      exerciseStates[exercise.id]?.expanded ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
              </div>
            </CardHeader>
            
            {exerciseStates[exercise.id]?.expanded && (
              <>
                <CardContent className="pt-4">
                  {exercise.notes && (
                    <div className="mb-4 text-sm bg-muted p-3 rounded-md">
                      <p className="font-medium mb-1">Notes:</p>
                      <p>{exercise.notes}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 text-sm font-medium border-b pb-2">
                      <div>Set</div>
                      <div>Weight</div>
                      <div>Reps</div>
                      <div>Done</div>
                    </div>
                    
                    {exerciseStates[exercise.id]?.sets.map((set, setIdx) => (
                      <div 
                        key={`${exercise.id}-set-${setIdx}`}
                        className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center"
                      >
                        <div className="font-medium">{set.setNumber}</div>
                        <Input
                          type="number"
                          placeholder="lbs"
                          value={set.weight}
                          onChange={(e) => handleSetChange(exercise.id, setIdx, 'weight', e.target.value)}
                          className="h-9"
                        />
                        <Input
                          type="number"
                          placeholder="count"
                          value={set.reps}
                          onChange={(e) => handleSetChange(exercise.id, setIdx, 'reps', e.target.value)}
                          className="h-9"
                        />
                        <Checkbox
                          checked={set.completed}
                          onCheckedChange={(checked) => 
                            handleSetCompletion(exercise.id, setIdx, checked === true)
                          }
                          className="h-5 w-5 data-[state=checked]:bg-client data-[state=checked]:border-client"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
      
      <div className="sticky bottom-16 bg-gray-50 pt-4 pb-2">
        <Button
          onClick={finishWorkout}
          disabled={!isWorkoutComplete()}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-6"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Complete Workout
        </Button>
        {!isWorkoutComplete() && (
          <p className="text-xs text-center mt-2 text-muted-foreground">
            Complete all sets to finish the workout
          </p>
        )}
      </div>
    </div>
  );
};

export default ActiveWorkout;
