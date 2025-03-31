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
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, MapPin } from 'lucide-react';
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
      runData?: {
        distance: string;
        duration: string;
        location: string;
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

  const [pendingRuns, setPendingRuns] = useState<Array<{
    exerciseId: string;
    distance: string;
    duration: string;
    location: string;
  }>>([]);

  const { data: workoutData, isLoading } = useQuery({
    queryKey: ['active-workout', workoutCompletionId],
    queryFn: async () => {
      try {
        console.log("Fetching workout data for completion ID:", workoutCompletionId);
        
        const { data: completionData, error: completionError } = await supabase
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
          .eq('workout_id', workoutCompletionId || '')
          .eq('user_id', user?.id)
          .maybeSingle();

        if (completionError) {
          console.error("Error fetching workout data:", completionError);
          throw completionError;
        }
        
        console.log("Fetched workout data:", completionData);
        
        if (!completionData || !completionData.workout) {
          console.error("Workout data missing or incomplete:", completionData);
          
          const { data: workoutOnlyData, error: workoutError } = await supabase
            .from('workouts')
            .select(`
              *,
              workout_exercises (
                *,
                exercise:exercise_id (*)
              )
            `)
            .eq('id', workoutCompletionId || '')
            .maybeSingle();
            
          if (workoutError) {
            console.error("Error fetching workout directly:", workoutError);
            throw workoutError;
          }
          
          if (!workoutOnlyData) {
            console.error("Workout not found with ID:", workoutCompletionId);
            return null;
          }
          
          return {
            id: null,
            user_id: user?.id,
            workout_id: workoutCompletionId,
            completed_at: null,
            workout: workoutOnlyData,
            workout_set_completions: []
          };
        }
        
        return completionData;
      } catch (error) {
        console.error("Error in workout data query:", error);
        throw error;
      }
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
      
      if (pendingCardio.length > 0) {
        const cardioPromises = pendingCardio.map(item => {
          const distance = item.distance && item.distance.trim() !== '' 
            ? item.distance
            : null;
            
          return trackWorkoutSet(
            workoutCompletionId!,
            item.exerciseId,
            1,
            null,
            null,
            null,
            distance,
            item.duration || null,
            item.location || null
          );
        });
        promises.push(...cardioPromises);
      }
      
      if (pendingFlexibility.length > 0) {
        const flexibilityPromises = pendingFlexibility.map(item => {
          return trackWorkoutSet(
            workoutCompletionId!,
            item.exerciseId,
            1,
            null,
            null,
            null,
            null,
            item.duration || null,
            null
          );
        });
        promises.push(...flexibilityPromises);
      }
      
      if (pendingRuns.length > 0) {
        const runPromises = pendingRuns.map(item => {
          const distance = item.distance && item.distance.trim() !== '' 
            ? item.distance
            : null;
            
          return trackWorkoutSet(
            workoutCompletionId!,
            item.exerciseId,
            1,
            null,
            null,
            null,
            distance,
            null,
            item.location || null
          );
        });
        promises.push(...runPromises);
      }
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-workout', workoutCompletionId] });
      setPendingSets([]);
      setPendingCardio([]);
      setPendingFlexibility([]);
      setPendingRuns([]);
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
        const exerciseName = (exercise.exercise?.name || '').toLowerCase();
        const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
        
        if (isRunExercise) {
          const existingSet = workoutData.workout_set_completions?.find(
            (set: any) => set.workout_exercise_id === exercise.id && set.set_number === 1
          );
          
          initialState[exercise.id] = {
            expanded: true,
            sets: [],
            runData: {
              distance: existingSet?.distance || '',
              duration: existingSet?.duration || '',
              location: existingSet?.location || '',
              completed: !!existingSet?.completed
            }
          };
        } else if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
          const sets = Array.from({ length: exercise.sets }, (_, i) => {
            const existingSet = workoutData.workout_set_completions?.find(
              (set: any) => set.workout_exercise_id === exercise.id && set.set_number === i + 1
            );
            
            let defaultReps = '';
            if (exercise.reps) {
              const repsMatch = exercise.reps.match(/^(\d+)$/);
              if (repsMatch) {
                defaultReps = repsMatch[1];
              }
            }
            
            return {
              setNumber: i + 1,
              weight: existingSet?.weight?.toString() || '',
              reps: existingSet?.reps_completed?.toString() || defaultReps,
              completed: !!existingSet?.completed,
            };
          });
          
          initialState[exercise.id] = {
            expanded: true,
            sets,
          };
        } else if (exerciseType === 'cardio') {
          const existingSet = workoutData.workout_set_completions?.find(
            (set: any) => set.workout_exercise_id === exercise.id && set.set_number === 1
          );
          
          initialState[exercise.id] = {
            expanded: true,
            sets: [],
            cardioData: {
              distance: existingSet?.distance || '',
              duration: existingSet?.duration || '',
              location: existingSet?.location || '',
              completed: !!existingSet?.completed
            }
          };
        } else if (exerciseType === 'flexibility') {
          const existingSet = workoutData.workout_set_completions?.find(
            (set: any) => set.workout_exercise_id === exercise.id && set.set_number === 1
          );
          
          initialState[exercise.id] = {
            expanded: true,
            sets: [],
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
    setExerciseStates((prev) => {
      if (!prev[exerciseId]) {
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          sets: prev[exerciseId].sets.map((set, idx) => 
            idx === setIndex ? { ...set, [field]: value } : set
          ),
        },
      };
    });
  };

  const handleCardioChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates((prev) => {
      if (!prev[exerciseId] || !prev[exerciseId].cardioData) {
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          cardioData: {
            ...prev[exerciseId].cardioData!,
            [field]: value
          }
        }
      };
    });
  };

  const handleFlexibilityChange = (exerciseId: string, field: 'duration', value: string) => {
    setExerciseStates((prev) => {
      if (!prev[exerciseId] || !prev[exerciseId].flexibilityData) {
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          flexibilityData: {
            ...prev[exerciseId].flexibilityData!,
            [field]: value
          }
        }
      };
    });
  };

  const handleRunChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates((prev) => {
      if (!prev[exerciseId] || !prev[exerciseId].runData) {
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          runData: {
            ...prev[exerciseId].runData!,
            [field]: value
          }
        }
      };
    });
  };

  const handleSetCompletion = (exerciseId: string, setIndex: number, completed: boolean) => {
    setExerciseStates((prev) => {
      if (!prev[exerciseId]) {
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          sets: prev[exerciseId].sets.map((set, idx) => 
            idx === setIndex ? { ...set, completed } : set
          ),
        },
      };
    });

    if (completed) {
      if (!exerciseStates[exerciseId] || !exerciseStates[exerciseId].sets || setIndex >= exerciseStates[exerciseId].sets.length) {
        console.error(`Invalid exercise ID or set index: ${exerciseId}, ${setIndex}`);
        return;
      }

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
    setExerciseStates((prev) => {
      if (!prev[exerciseId] || !prev[exerciseId].cardioData) {
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          cardioData: {
            ...prev[exerciseId].cardioData!,
            completed
          }
        }
      };
    });

    if (completed) {
      if (!exerciseStates[exerciseId] || !exerciseStates[exerciseId].cardioData) {
        console.error(`Invalid exercise ID or missing cardio data: ${exerciseId}`);
        return;
      }

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
    setExerciseStates((prev) => {
      if (!prev[exerciseId] || !prev[exerciseId].flexibilityData) {
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          flexibilityData: {
            ...prev[exerciseId].flexibilityData!,
            completed
          }
        }
      };
    });

    if (completed) {
      if (!exerciseStates[exerciseId] || !exerciseStates[exerciseId].flexibilityData) {
        console.error(`Invalid exercise ID or missing flexibility data: ${exerciseId}`);
        return;
      }

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

  const handleRunCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates((prev) => {
      if (!prev[exerciseId] || !prev[exerciseId].runData) {
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          runData: {
            ...prev[exerciseId].runData!,
            completed
          }
        }
      };
    });

    if (completed) {
      if (!exerciseStates[exerciseId] || !exerciseStates[exerciseId].runData) {
        console.error(`Invalid exercise ID or missing run data: ${exerciseId}`);
        return;
      }

      const runData = exerciseStates[exerciseId].runData!;
      const distance = runData.distance.trim() === '' ? null : runData.distance;
      setPendingRuns(prev => [
        ...prev.filter(r => r.exerciseId !== exerciseId),
        {
          exerciseId,
          distance: distance || '',
          location: runData.location
        }
      ]);
    } else {
      setPendingRuns(prev => prev.filter(item => item.exerciseId !== exerciseId));
    }
  };

  const toggleExerciseExpanded = (exerciseId: string) => {
    setExerciseStates((prev) => {
      if (!prev[exerciseId]) {
        console.error(`Exercise ID not found in state: ${exerciseId}`);
        return prev;
      }

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          expanded: !prev[exerciseId].expanded,
        },
      };
    });
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
    <div className="space-y-6 pb-28 flex flex-col items-center max-w-md mx-auto">
      <div className="flex flex-col items-center gap-2 text-center w-full">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="border border-gray-200 hover:border-gray-300 self-start mb-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{workoutData?.workout.title}</h1>
        <p className="text-muted-foreground">Track your progress</p>
      </div>

      <div className="space-y-4 w-full">
        {workoutExercises.map((exercise: any) => {
          const exerciseType = exercise.exercise?.exercise_type || 'strength';
          const exerciseName = (exercise.exercise?.name || '').toLowerCase();
          const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
          const exerciseState = exerciseStates[exercise.id];
          
          if (!exerciseState) {
            return null;
          }
          
          return (
            <Card key={exercise.id} className="overflow-hidden border-gray-200 w-full">
              <CardHeader 
                className="cursor-pointer bg-client/5 text-center" 
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="text-center w-full">
                    <CardTitle className="text-base">{exercise.exercise.name}</CardTitle>
                    <CardDescription>
                      {isRunExercise ? (
                        <span className="text-blue-600">Running</span>
                      ) : exerciseType === 'strength' || exerciseType === 'bodyweight' ? (
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
                    {isRunExercise ? (
                      exerciseState.runData?.completed && (
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                      )
                    ) : exerciseType === 'strength' || exerciseType === 'bodyweight' ? (
                      exerciseState.sets.every(set => set.completed) && (
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                      )
                    ) : exerciseType === 'cardio' ? (
                      exerciseState.cardioData?.completed && (
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                      )
                    ) : exerciseType === 'flexibility' ? (
                      exerciseState.flexibilityData?.completed && (
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                      )
                    ) : null}
                    <ChevronRight 
                      className={`h-5 w-5 transition-transform ${
                        exerciseState.expanded ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </div>
              </CardHeader>
              
              {exerciseState.expanded && (
                <>
                  <CardContent className="pt-4">
                    {exercise.notes && (
                      <div className="mb-4 text-sm bg-muted p-3 rounded-md text-center">
                        <p className="font-medium mb-1">Notes:</p>
                        <p>{exercise.notes}</p>
                      </div>
                    )}
                    
                    {isRunExercise ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="text-center">
                            <label className="block text-sm font-medium mb-1 text-center">Distance (miles)</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={exerciseState.runData?.distance || ''}
                              onChange={(e) => handleRunChange(exercise.id, 'distance', e.target.value)}
                              className="h-9 text-center border border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-center">Enter distance in miles</p>
                          </div>
                          <div className="text-center">
                            <label className="block text-sm font-medium mb-1 text-center">Duration (hh:mm:ss)</label>
                            <Input
                              placeholder="00:00:00"
                              value={exerciseState.runData?.duration || ''}
                              onChange={(e) => handleRunChange(
                                exercise.id, 
                                'duration', 
                                formatDurationInput(e.target.value)
                              )}
                              className="h-9 text-center border border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-center">Format: hours:minutes:seconds</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <label className="block text-sm font-medium mb-1 text-center">Location</label>
                          <ToggleGroup 
                            type="single" 
                            className="justify-center"
                            value={exerciseState.runData?.location || ''}
                            onValueChange={(value) => {
                              if (value) handleRunChange(exercise.id, 'location', value);
                            }}
                          >
                            <ToggleGroupItem 
                              value="indoor" 
                              className="text-sm border border-gray-300 hover:border-client data-[state=on]:border-client"
                            >
                              <MapPin className="h-3 w-3 mr-1" /> Indoor
                            </ToggleGroupItem>
                            <ToggleGroupItem 
                              value="outdoor" 
                              className="text-sm border border-gray-300 hover:border-client data-[state=on]:border-client"
                            >
                              <MapPin className="h-3 w-3 mr-1" /> Outdoor
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                        <div className="flex justify-center items-center mt-2">
                          <span className="mr-2 text-sm">Mark as completed:</span>
                          <Checkbox
                            checked={exerciseState.runData?.completed || false}
                            onCheckedChange={(checked) => 
                              handleRunCompletion(exercise.id, checked === true)
                            }
                            className="h-5 w-5 data-[state=checked]:bg-client data-[state=checked]:border-client border-2"
                          />
                        </div>
                      </div>
                    ) : exerciseType === 'strength' || exerciseType === 'bodyweight' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 text-sm font-medium border-b pb-2 text-center">
                          <div className="text-center">Set</div>
                          <div className="text-center">Reps</div>
                          {exerciseType === 'strength' && <div className="text-center">Weight</div>}
                          {exerciseType === 'bodyweight' && <div className="opacity-0">-</div>}
                          <div className="text-center">Done</div>
                        </div>
                        
                        {exerciseState.sets.map((set, setIdx) => (
                          <div 
                            key={`${exercise.id}-set-${setIdx}`}
                            className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center"
                          >
                            <div className="font-medium text-center">{set.setNumber}</div>
                            <Input
                              type="number"
                              placeholder="count"
                              value={set.reps}
                              onChange={(e) => handleSetChange(exercise.id, setIdx, 'reps', e.target.value)}
                              className="h-9 text-center"
                            />
                            {exerciseType === 'strength' ? (
                              <Input
                                type="number"
                                placeholder="lbs"
                                value={set.weight}
                                onChange={(e) => handleSetChange(exercise.id, setIdx, 'weight', e.target.value)}
                                className="h-9 text-center"
                              />
                            ) : (
                              <div className="text-center text-sm text-muted-foreground">
                                Bodyweight
                              </div>
                            )}
                            <Checkbox
                              checked={set.completed}
                              onCheckedChange={(checked) => 
                                handleSetCompletion(exercise.id, setIdx, checked === true)
                              }
                              className="h-5 w-5 data-[state=checked]:bg-client data-[state=checked]:border-client mx-auto"
                            />
                          </div>
                        ))}
                      </div>
                    ) : exerciseType === 'cardio' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <label className="block text-sm font-medium mb-1 text-center">Distance (miles)</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={exerciseState.cardioData?.distance || ''}
                              onChange={(e) => handleCardioChange(exercise.id, 'distance', e.target.value)}
                              className="h-9 text-center border border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-center">Enter distance in miles</p>
                          </div>
                          <div className="text-center">
                            <label className="block text-sm font-medium mb-1 text-center">Duration (hh:mm:ss)</label>
                            <Input
                              placeholder="00:00:00"
                              value={exerciseState.cardioData?.duration || ''}
                              onChange={(e) => handleCardioChange(
                                exercise.id, 
                                'duration', 
                                formatDurationInput(e.target.value)
                              )}
                              className="h-9 text-center border border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-center">Format: hours:minutes:seconds</p>
                          </div>
                          <div className="text-center">
                            <label className="block text-sm font-medium mb-1 text-center">Location</label>
                            <ToggleGroup 
                              type="single" 
                              className="justify-center"
                              value={exerciseState.cardioData?.location || ''}
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
                        <div className="flex justify-center items-center mt-2">
                          <span className="mr-2 text-sm">Mark as completed:</span>
                          <Checkbox
                            checked={exerciseState.cardioData?.completed || false}
                            onCheckedChange={(checked) => 
                              handleCardioCompletion(exercise.id, checked === true)
                            }
                            className="h-5 w-5 data-[state=checked]:bg-client data-[state=checked]:border-client border-2"
                          />
                        </div>
                      </div>
                    ) : exerciseType === 'flexibility' ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <label className="block text-sm font-medium mb-1 text-center">Duration</label>
                          <Input
                            placeholder="e.g., 00:30, 01:00"
                            value={exerciseState.flexibilityData?.duration || ''}
                            onChange={(e) => handleFlexibilityChange(
                              exercise.id, 
                              'duration', 
                              formatDurationInput(e.target.value)
                            )}
                            className="h-9 text-center border border-gray-200 max-w-xs mx-auto"
                          />
                          <p className="text-xs text-muted-foreground mt-1 text-center">Format: minutes:seconds</p>
                        </div>
                        <div className="flex justify-center items-center mt-2">
                          <span className="mr-2 text-sm">Mark as completed:</span>
                          <Checkbox
                            checked={exerciseState.flexibilityData?.completed || false}
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
          {(pendingSets.length > 0 || pendingCardio.length > 0 || pendingFlexibility.length > 0 || pendingRuns.length > 0) && (
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
