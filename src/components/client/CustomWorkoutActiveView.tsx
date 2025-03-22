
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchCustomWorkout, 
  startCustomWorkout,
  trackCustomWorkoutSet,
  completeCustomWorkout
} from '@/services/client-custom-workout-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, Save, Star } from 'lucide-react';
import { toast } from 'sonner';

const CustomWorkoutActiveView = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
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

  // Fetch workout data
  const { data: workoutData, isLoading } = useQuery({
    queryKey: ['custom-workout', workoutId],
    queryFn: async () => {
      if (!workoutId) throw new Error('Workout ID is required');
      return fetchCustomWorkout(workoutId);
    },
    enabled: !!workoutId
  });

  // Start workout mutation
  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!workoutId) throw new Error('Workout ID is required');
      return startCustomWorkout(workoutId);
    },
    onSuccess: (data) => {
      setCompletionId(data.id);
      toast.success('Workout started!');
    },
    onError: (error) => {
      console.error('Error starting workout:', error);
      toast.error('Failed to start workout');
    }
  });

  // Track set completion
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
      if (!completionId) throw new Error('Workout not started');
      
      return trackCustomWorkoutSet(
        completionId,
        exerciseId,
        setNumber,
        weight ? parseFloat(weight) : null,
        reps ? parseInt(reps) : null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-workout', workoutId] });
    },
    onError: (error) => {
      console.error('Error tracking set:', error);
      toast.error('Failed to save set');
    }
  });

  // Complete workout mutation
  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!completionId) throw new Error('No active workout');
      return completeCustomWorkout(completionId, rating, notes);
    },
    onSuccess: () => {
      toast.success('Workout completed!');
      navigate('/client-dashboard/workouts');
    },
    onError: (error) => {
      console.error('Error completing workout:', error);
      toast.error('Failed to complete workout');
    },
    onSettled: () => {
      setIsCompleting(false);
    }
  });

  // Initialize workout on mount
  useEffect(() => {
    if (!completionId && workoutId && !startWorkoutMutation.isPending) {
      startWorkoutMutation.mutate();
    }
  }, [workoutId, completionId, startWorkoutMutation]);

  // Initialize exercise states when workout data loads
  useEffect(() => {
    if (workoutData?.client_custom_workout_exercises) {
      const exercises = workoutData.client_custom_workout_exercises;
      const initialState: any = {};
      
      exercises.forEach((exercise: any) => {
        // Determine number of sets from exercise data
        const numSets = exercise.sets || 1;
        
        // Create array for sets
        const sets = Array.from({ length: numSets }, (_, i) => ({
          setNumber: i + 1,
          weight: '',
          reps: '',
          completed: false
        }));
        
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
    // Update local state
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        sets: prev[exerciseId].sets.map((set, idx) => 
          idx === setIndex ? { ...set, completed } : set
        ),
      },
    }));

    // Only track if marking as completed
    if (completed) {
      const set = exerciseStates[exerciseId].sets[setIndex];
      try {
        await trackSetMutation.mutateAsync({
          exerciseId,
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps,
        });
      } catch (error) {
        // If tracking fails, revert the UI state
        setExerciseStates((prev) => ({
          ...prev,
          [exerciseId]: {
            ...prev[exerciseId],
            sets: prev[exerciseId].sets.map((set, idx) => 
              idx === setIndex ? { ...set, completed: false } : set
            ),
          },
        }));
      }
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
    if (!workoutData?.client_custom_workout_exercises || !exerciseStates) return false;
    
    return workoutData.client_custom_workout_exercises.every((exercise: any) => {
      const exerciseState = exerciseStates[exercise.id];
      if (!exerciseState) return false;
      
      return exerciseState.sets.every((set) => set.completed);
    });
  };

  const handleCompleteWorkout = () => {
    setIsCompleting(true);
    completeWorkoutMutation.mutate();
  };

  if (isLoading || startWorkoutMutation.isPending) {
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

  const exercises = workoutData.client_custom_workout_exercises || [];

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
          <h1 className="text-2xl font-bold">{workoutData.title}</h1>
          <p className="text-muted-foreground">Track your progress</p>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No Exercises</h2>
          <p className="text-muted-foreground mb-6">
            This workout doesn't have any exercises. You can still mark it as complete.
          </p>
          <Button onClick={handleCompleteWorkout} className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Workout
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {exercises.map((exercise: any) => {
              const isCardio = exercise.custom_exercise_name ? 
                (exercise.custom_exercise_name.toLowerCase().includes('run') || 
                 exercise.custom_exercise_name.toLowerCase().includes('walk')) :
                exercise.exercise?.name.toLowerCase().includes('run') || 
                exercise.exercise?.name.toLowerCase().includes('walk');
              
              const exerciseName = exercise.exercise?.name || exercise.custom_exercise_name || 'Exercise';
              
              return (
                <Card key={exercise.id} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer bg-client/5" 
                    onClick={() => toggleExerciseExpanded(exercise.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">{exerciseName}</CardTitle>
                        <CardDescription>
                          {!isCardio && exercise.sets && `${exercise.sets} sets`}
                          {!isCardio && exercise.reps && ` • ${exercise.reps} reps`}
                          {!isCardio && exercise.rest_seconds && ` • ${exercise.rest_seconds}s rest`}
                          {isCardio && 'Cardio exercise'}
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
                        
                        {isCardio ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Mark as completed</span>
                              <Checkbox
                                checked={exerciseStates[exercise.id]?.sets[0]?.completed || false}
                                onCheckedChange={(checked) => 
                                  handleSetCompletion(exercise.id, 0, checked === true)
                                }
                                className="h-5 w-5 data-[state=checked]:bg-client data-[state=checked]:border-client"
                              />
                            </div>
                            
                            <Textarea 
                              placeholder="Add notes about distance, time, or how it felt..."
                              className="h-20"
                            />
                          </div>
                        ) : (
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
                        )}
                      </CardContent>
                    </>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="space-y-6 mt-8 pt-4 pb-16 border-t">
            <div>
              <h3 className="text-base font-medium mb-2">Overall Workout Notes</h3>
              <Textarea
                placeholder="How did this workout feel? What was challenging?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <h3 className="text-base font-medium mb-2">Rate this workout</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`rounded-full p-1 transition-colors ${
                      rating && star <= rating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCompleteWorkout}
              disabled={!isWorkoutComplete() || isCompleting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-6"
            >
              {isCompleting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              Complete Workout
            </Button>
            
            {!isWorkoutComplete() && (
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Complete all sets to finish the workout
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomWorkoutActiveView;
