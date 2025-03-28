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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
      cardioData?: {
        distance: string;
        duration: string;
        location: string;
        completed: boolean;
      };
      flexibilityData?: {
        duration: string;
        completed: boolean;
      };
    };
  }>({});

  const [pendingSets, setPendingSets] = useState<Array<{
    exerciseId: string;
    setNumber: number;
    weight: string;
    reps: string;
  }>>([]);

  const [pendingCardio, setPendingCardio] = useState<Array<{
    exerciseId: string;
    distance: string;
    duration: string;
    location: string;
  }>>([]);

  const [pendingFlexibility, setPendingFlexibility] = useState<Array<{
    exerciseId: string;
    duration: string;
  }>>([]);

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
      notes,
      distance,
      duration,
      location
    }: {
      exerciseId: string;
      setNumber: number;
      weight: string | null;
      reps: string | null;
      notes?: string | null;
      distance?: string | null;
      duration?: string | null;
      location?: string | null;
    }) => {
      if (!workoutCompletionId) {
        toast.error("Missing workout completion ID");
        return null;
      }
      
      console.log("Tracking set:", {
        workoutCompletionId,
        exerciseId,  // This is actually workout_exercise_id
        setNumber,
        weight: weight ? parseFloat(weight) : null,
        reps: reps ? parseInt(reps, 10) : null,
        notes,
        distance,
        duration,
        location
      });
      
      try {
        return await trackWorkoutSet(
          workoutCompletionId,
          exerciseId,  // Passing workout_exercise_id to the function
          setNumber,
          weight ? parseFloat(weight) : null,
          reps ? parseInt(reps, 10) : null,
          notes || null,
          distance || null,
          duration || null,
          location || null
        );
      } catch (error) {
        console.error("Error in trackSetMutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Successfully tracked set:", data);
      queryClient.invalidateQueries({ queryKey: ['active-workout', workoutCompletionId] });
    },
    onError: (error: any) => {
      console.error('Error tracking set:', error);
      toast.error(`Failed to save set: ${error?.message || 'Unknown error'}`);
    },
  });

  const saveAllSetsMutation = useMutation({
    mutationFn: async () => {
      if (!workoutCompletionId) {
        return null;
      }
      
      const promises = [];
      
      // Handle strength/bodyweight sets
      if (pendingSets.length > 0) {
        const setPromises = pendingSets.map(set => 
          trackWorkoutSet(
            workoutCompletionId!,
            set.exerciseId,
            set.setNumber,
            set.weight ? parseFloat(set.weight) : null,
            set.reps ? parseInt(set.reps, 10) : null
          )
        );
        promises.push(...setPromises);
      }
      
      // Handle cardio exercises
      if (pendingCardio.length > 0) {
        const cardioPromises = pendingCardio.map(item => {
          // Make sure distance is either a valid value or null
          const distance = item.distance && item.distance.trim() !== '' 
            ? item.distance
            : null;
            
          return trackWorkoutSet(
            workoutCompletionId!,
            item.exerciseId,
            1, // Just use set 1 for cardio
            null, // No weight for cardio
            null, // No reps for cardio
            null, // No general notes
            distance, // Store distance in its own column
            item.duration || null, // Store duration in its own column
            item.location || null  // Store location in its own column
          );
        });
        promises.push(...cardioPromises);
      }
      
      // Handle flexibility exercises
      if (pendingFlexibility.length > 0) {
        const flexibilityPromises = pendingFlexibility.map(item => {
          return trackWorkoutSet(
            workoutCompletionId!,
            item.exerciseId,
            1, // Just use set 1 for flexibility
            null, // No weight for flexibility
            null, // No reps for flexibility
            null, // No general notes
            null, // No distance
            item.duration || null, // Store duration in its own column
            null  // No location
          );
        });
        promises.push(...flexibilityPromises);
      }
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Workout completed successfully');
      queryClient.invalidateQueries({ queryKey: ['active-workout', workoutCompletionId] });
      setPendingSets([]);
      setPendingCardio([]);
      setPendingFlexibility([]);
      navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
    },
    onError: (error: any) => {
      console.error('Error saving workout data:', error);
      toast.error(`Failed to save workout: ${error?.message || 'Unknown error'}`);
    },
  });

  useEffect(() => {
    if (workoutData?.workout?.workout_exercises) {
      const initialState: any = {};
      
      const workoutExercises = Array.isArray(workoutData.workout.workout_exercises) 
        ? workoutData.workout.workout_exercises 
        : [];
      
      workoutExercises.forEach((exercise: any) => {
        const exerciseType = exercise.exercise?.exercise_type || 'strength';
        
        if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
          // Handle strength and bodyweight exercises with sets and reps
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
        } else if (exerciseType === 'cardio') {
          // Handle cardio exercises
          const existingSet = workoutData.workout_set_completions?.find(
            (set: any) => set.workout_exercise_id === exercise.id && set.set_number === 1
          );
          
          initialState[exercise.id] = {
            expanded: true,
            sets: [], // Empty sets for cardio
            cardioData: {
              distance: existingSet?.distance || '',
              duration: existingSet?.duration || '',
              location: existingSet?.location || '',
              completed: !!existingSet?.completed
            }
          };
        } else if (exerciseType === 'flexibility') {
          // Handle flexibility exercises
          const existingSet = workoutData.workout_set_completions?.find(
            (set: any) => set.workout_exercise_id === exercise.id && set.set_number === 1
          );
          
          initialState[exercise.id] = {
            expanded: true,
            sets: [], // Empty sets for flexibility
            flexibilityData: {
              duration: existingSet?.duration || '',
              completed: !!existingSet?.completed
            }
          };
        }
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

  const handleCardioChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        cardioData: {
          ...prev[exerciseId].cardioData!,
          [field]: value
        }
      }
    }));
  };

  const handleFlexibilityChange = (exerciseId: string, field: 'duration', value: string) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        flexibilityData: {
          ...prev[exerciseId].flexibilityData!,
          [field]: value
        }
      }
    }));
  };

  const handleSetCompletion = (exerciseId: string, setIndex: number, completed: boolean) => {
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
      setPendingSets(prev => [
        ...prev.filter(s => !(s.exerciseId === exerciseId && s.setNumber === set.setNumber)),
        {
          exerciseId,
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps
        }
      ]);
    } else {
      setPendingSets(prev => 
        prev.filter(set => !(set.exerciseId === exerciseId && set.setNumber === setIndex + 1))
      );
    }
  };

  const handleCardioCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        cardioData: {
          ...prev[exerciseId].cardioData!,
          completed
        }
      }
    }));

    if (completed) {
      const cardioData = exerciseStates[exerciseId].cardioData!;
      const distance = cardioData.distance.trim() === '' ? null : cardioData.distance;
      setPendingCardio(prev => [
        ...prev.filter(c => c.exerciseId !== exerciseId),
        {
          exerciseId,
          distance: distance,
          duration: cardioData.duration,
          location: cardioData.location
        }
      ]);
    } else {
      setPendingCardio(prev => prev.filter(item => item.exerciseId !== exerciseId));
    }
  };

  const handleFlexibilityCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        flexibilityData: {
          ...prev[exerciseId].flexibilityData!,
          completed
        }
      }
    }));

    if (completed) {
      const flexData = exerciseStates[exerciseId].flexibilityData!;
      setPendingFlexibility(prev => [
        ...prev.filter(f => f.exerciseId !== exerciseId),
        {
          exerciseId,
          duration: flexData.duration
        }
      ]);
    } else {
      setPendingFlexibility(prev => prev.filter(item => item.exerciseId !== exerciseId));
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
    return true;
  };

  const finishWorkout = async () => {
    try {
      await saveAllSetsMutation.mutateAsync();
    } catch (error) {
      console.error("Error saving workout data:", error);
    }
  };

  const formatDurationInput = (value: string): string => {
    let cleaned = value.replace(/[^\d:]/g, '');
    
    const parts = cleaned.split(':');
    
    if (parts.length > 3) {
      cleaned = parts.slice(0, 3).join(':');
    }
    
    return cleaned;
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

  const workoutExercises = Array.isArray(workoutData.workout?.workout_exercises) 
    ? workoutData.workout.workout_exercises 
    : [];

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="border border-gray-200 hover:border-gray-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{workoutData?.workout.title}</h1>
          <p className="text-muted-foreground">Track your progress</p>
        </div>
      </div>

      <div className="space-y-4">
        {workoutExercises.map((exercise: any) => {
          const exerciseType = exercise.exercise?.exercise_type || 'strength';
          
          return (
            <Card key={exercise.id} className="overflow-hidden border-gray-200">
              <CardHeader 
                className="cursor-pointer bg-client/5" 
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base">{exercise.exercise.name}</CardTitle>
                    <CardDescription>
                      {exerciseType === 'strength' || exerciseType === 'bodyweight' ? (
                        <>
                          {exercise.sets} sets • {exercise.reps} reps
                          {exercise.rest_seconds ? ` • ${exercise.rest_seconds}s rest` : ''}
                        </>
                      ) : exerciseType === 'cardio' ? (
                        <span className="text-blue-600">Cardio</span>
                      ) : exerciseType === 'flexibility' ? (
                        <span className="text-purple-600">Flexibility/Mobility</span>
                      ) : (
                        <>
                          {exercise.sets} sets • {exercise.reps} reps
                          {exercise.rest_seconds ? ` • ${exercise.rest_seconds}s rest` : ''}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {exerciseType === 'strength' || exerciseType === 'bodyweight' ? (
                      exerciseStates[exercise.id]?.sets.every(set => set.completed) && (
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                      )
                    ) : exerciseType === 'cardio' ? (
                      exerciseStates[exercise.id]?.cardioData?.completed && (
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                      )
                    ) : exerciseType === 'flexibility' ? (
                      exerciseStates[exercise.id]?.flexibilityData?.completed && (
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                      )
                    ) : null}
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
                    
                    {exerciseType === 'strength' || exerciseType === 'bodyweight' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 text-sm font-medium border-b pb-2">
                          <div>Set</div>
                          <div className="text-left">Reps</div>
                          {exerciseType === 'strength' && <div className="text-left">Weight</div>}
                          {exerciseType === 'bodyweight' && <div className="opacity-0">-</div>}
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
                              placeholder="count"
                              value={set.reps}
                              onChange={(e) => handleSetChange(exercise.id, setIdx, 'reps', e.target.value)}
                              className="h-9 text-left"
                            />
                            {exerciseType === 'strength' ? (
                              <Input
                                type="number"
                                placeholder="lbs"
                                value={set.weight}
                                onChange={(e) => handleSetChange(exercise.id, setIdx, 'weight', e.target.value)}
                                className="h-9 text-left"
                              />
                            ) : (
                              <div className="text-left text-sm text-muted-foreground">
                                Bodyweight
                              </div>
                            )}
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
                    ) : exerciseType === 'cardio' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-left">Distance (miles)</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={exerciseStates[exercise.id]?.cardioData?.distance || ''}
                              onChange={(e) => handleCardioChange(exercise.id, 'distance', e.target.value)}
                              className="h-9 text-left border border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-left">Enter distance in miles</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-left">Duration (hh:mm:ss)</label>
                            <Input
                              placeholder="00:00:00"
                              value={exerciseStates[exercise.id]?.cardioData?.duration || ''}
                              onChange={(e) => handleCardioChange(
                                exercise.id, 
                                'duration', 
                                formatDurationInput(e.target.value)
                              )}
                              className="h-9 text-left border border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-left">Format: hours:minutes:seconds</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-left">Location</label>
                            <ToggleGroup 
                              type="single" 
                              className="justify-start"
                              value={exerciseStates[exercise.id]?.cardioData?.location || ''}
                              onValueChange={(value) => {
                                if (value) handleCardioChange(exercise.id, 'location', value);
                              }}
                            >
                              <ToggleGroupItem 
                                value="indoor" 
                                className="text-sm border border-gray-300 hover:border-client data-[state=on]:border-client"
                              >
                                Indoor
                              </ToggleGroupItem>
                              <ToggleGroupItem 
                                value="outdoor" 
                                className="text-sm border border-gray-300 hover:border-client data-[state=on]:border-client"
                              >
                                Outdoor
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                        </div>
                        <div className="flex justify-end items-center mt-2">
                          <span className="mr-2 text-sm">Mark as completed:</span>
                          <Checkbox
                            checked={exerciseStates[exercise.id]?.cardioData?.completed || false}
                            onCheckedChange={(checked) => 
                              handleCardioCompletion(exercise.id, checked === true)
                            }
                            className="h-5 w-5 data-[state=checked]:bg-client data-[state=checked]:border-client border-2"
                          />
                        </div>
                      </div>
                    ) : exerciseType === 'flexibility' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-left">Duration</label>
                          <Input
                            placeholder="e.g., 00:30, 01:00"
                            value={exerciseStates[exercise.id]?.flexibilityData?.duration || ''}
                            onChange={(e) => handleFlexibilityChange(
                              exercise.id, 
                              'duration', 
                              formatDurationInput(e.target.value)
                            )}
                            className="h-9 text-left border border-gray-200"
                          />
                          <p className="text-xs text-muted-foreground mt-1 text-left">Format: minutes:seconds</p>
                        </div>
                        <div className="flex justify-end items-center mt-2">
                          <span className="mr-2 text-sm">Mark as completed:</span>
                          <Checkbox
                            checked={exerciseStates[exercise.id]?.flexibilityData?.completed || false}
                            onCheckedChange={(checked) => 
                              handleFlexibilityCompletion(exercise.id, checked === true)
                            }
                            className="h-5 w-5 data-[state=checked]:bg-client data-[state=checked]:border-client border-2"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p>Please complete this exercise and mark it as done.</p>
                        <div className="flex justify-center mt-4">
                          <Checkbox
                            id={`complete-${exercise.id}`}
                            className="h-5 w-5 data-[state=checked]:bg-client data-[state=checked]:border-client border-2"
                          />
                          <label htmlFor={`complete-${exercise.id}`} className="ml-2">
                            Mark as completed
                          </label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>
      
      <div className="fixed bottom-16 left-0 right-0 z-10 bg-white shadow-lg px-4 pt-4 pb-2">
        <div className="container mx-auto max-w-md">
          <Button
            onClick={finishWorkout}
            disabled={saveAllSetsMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-6 border-2 border-green-700"
          >
            {saveAllSetsMutation.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-5 w-5" />
            )}
            Complete Workout
          </Button>
          {(pendingSets.length > 0 || pendingCardio.length > 0 || pendingFlexibility.length > 0) && (
            <p className="text-xs text-center mt-2 text-muted-foreground">
              All tracking data will be saved when you complete the workout
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkout;
