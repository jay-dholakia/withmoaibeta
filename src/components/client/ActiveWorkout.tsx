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
import { useWorkoutInitialization } from '@/hooks/useWorkoutInitialization';
import { PersonalRecord, Exercise, WorkoutExercise } from '@/types/workout';
import Stopwatch from './Stopwatch';
import { cn } from '@/lib/utils';
import { fetchSimilarExercises } from '@/services/exercise-service';
import { StrengthExercise } from './workout/StrengthExercise';
import { CardioExercise } from './workout/CardioExercise';
import { FlexibilityExercise } from './workout/FlexibilityExercise';
import { RunExercise } from './workout/RunExercise';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useWorkoutDraft } from '@/hooks/useWorkoutDraft';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [retryCount, setRetryCount] = useState(0);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [workoutDataLoaded, setWorkoutDataLoaded] = useState(false);
  const [autosaveRetries, setAutosaveRetries] = useState<number>(0);

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initCompleteForceCounter = useRef<number>(0);
  const forceInitRef = useRef<boolean>(false);

  const getWorkoutExercises = (data: any) => {
    if (!data || !data.workout) return [];
    
    let exercises = [];
    
    if (Array.isArray(data.workout.workout_exercises)) {
      exercises = data.workout.workout_exercises;
    } else {
      const standaloneExercises = (data.workout as any).standalone_workout_exercises;
      if (standaloneExercises && Array.isArray(standaloneExercises)) {
        exercises = standaloneExercises;
      } else if (data.standalone_workout_id && data.workout) {
        if (Array.isArray(data.workout.workout_exercises)) {
          exercises = data.workout.workout_exercises;
        }
      }
    }
    
    if (exercises.length === 0) {
      console.error("No workout exercises found in workoutData:", data);
      return [];
    }
    
    return [...exercises].sort((a, b) => {
      const orderA = typeof a.order_index === 'number' ? a.order_index : 0;
      const orderB = typeof b.order_index === 'number' ? b.order_index : 0;
      return orderA - orderB;
    });
  };

  const { data: workoutData, isLoading, error } = useQuery({
    queryKey: ['active-workout', workoutCompletionId, retryCount],
    queryFn: async () => {
      console.log(`Fetching workout data for ID: ${workoutCompletionId} (Attempt: ${retryCount + 1})`);
      
      try {
        const { data: workoutCompletion, error: completionError } = await supabase
          .from('workout_completions')
          .select(`*, workout:workout_id (*, workout_exercises (*, exercise:exercise_id (*)))`)
          .eq('id', workoutCompletionId || '')
          .maybeSingle();
        
        if (completionError) {
          console.error("Error fetching workout completion:", completionError);
        } else if (workoutCompletion) {
          console.log("Found workout completion:", workoutCompletion);
          return workoutCompletion;
        }

        const { data: byWorkoutId, error: workoutIdError } = await supabase
          .from('workout_completions')
          .select(`*, workout:workout_id (*, workout_exercises (*, exercise:exercise_id (*)))`)
          .eq('workout_id', workoutCompletionId || '')
          .eq('user_id', user?.id || '')
          .maybeSingle();
        
        if (workoutIdError) {
          console.error("Error fetching by workout_id:", workoutIdError);
        } else if (byWorkoutId) {
          console.log("Found workout by workout_id:", byWorkoutId);
          return byWorkoutId;
        }

        const { data: directWorkout, error: directWorkoutError } = await supabase
          .from('workouts')
          .select(`*, workout_exercises (*, exercise:exercise_id (*))`)
          .eq('id', workoutCompletionId || '')
          .maybeSingle();

        if (directWorkoutError) {
          console.error("Error fetching direct workout:", directWorkoutError);
        } else if (directWorkout) {
          console.log("Found direct workout:", directWorkout);
          
          return {
            id: null,
            user_id: user?.id,
            workout_id: directWorkout.id,
            started_at: new Date().toISOString(),
            completed_at: null,
            workout: directWorkout,
            workout_set_completions: []
          };
        }

        const { data: standaloneWorkout, error: standaloneError } = await supabase
          .from('standalone_workouts')
          .select(`*, standalone_workout_exercises (*, exercise:exercise_id (*))`)
          .eq('id', workoutCompletionId || '')
          .maybeSingle();
          
        if (standaloneError) {
          console.error("Error fetching standalone workout:", standaloneError);
        } else if (standaloneWorkout) {
          console.log("Found standalone workout:", standaloneWorkout);
          
          return {
            id: null,
            user_id: user?.id,
            standalone_workout_id: standaloneWorkout.id,
            started_at: new Date().toISOString(),
            completed_at: null,
            workout: {
              ...standaloneWorkout,
              workout_exercises: standaloneWorkout.standalone_workout_exercises
            },
            workout_set_completions: []
          };
        }
        
        console.error("Workout not found after multiple lookup attempts:", { 
          workoutCompletionId, 
          userId: user?.id 
        });
        
        throw new Error(`Workout not found: ${workoutCompletionId}`);
      } catch (error) {
        console.error("Error in workout query:", error);
        throw error;
      }
    },
    enabled: !!workoutCompletionId && !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching workout:", error);
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prevCount => prevCount + 1);
          }, 2000);
        } else {
          toast.error("Unable to load workout. Please try again later.");
        }
      }
    }
  });

  useEffect(() => {
    if (workoutData) {
      console.log("Workout data has finished loading:", workoutData);
      setWorkoutDataLoaded(true);
    }
  }, [workoutData]);

  const workoutExercises = workoutData ? getWorkoutExercises(workoutData) : [];
  
  const getWorkoutId = () => {
    if (!workoutData) return workoutCompletionId;
    if (workoutData.standalone_workout_id) return workoutData.standalone_workout_id;
    if (workoutData.workout?.id) return workoutData.workout.id;
    return workoutCompletionId;
  };

  const workoutId = getWorkoutId();

  const { draftData, draftLoaded, isLoading: isDraftLoading } = useWorkoutDraft({
    workoutId,
    onDraftLoaded: (loadedDraftData) => {
      console.log("Draft data has finished loading:", loadedDraftData);
    }
  });

  const { 
    exerciseStates, 
    setExerciseStates,
    sortedExerciseIds,
    initializationComplete
  } = useWorkoutInitialization({
    workoutExercises,
    draftData,
    draftLoaded,
    workoutDataLoaded
  });

  useEffect(() => {
    console.log("ActiveWorkout: Component mounted with workoutCompletionId:", workoutCompletionId);
    console.log("ActiveWorkout: Current user:", user?.id);
    
    loadingTimeoutRef.current = setTimeout(() => {
      if (!initialLoadComplete) {
        console.log("Safety timeout: forcing initialLoadComplete to true after delay");
        forceInitRef.current = true;
        setInitialLoadComplete(true);
      }
    }, 5000);
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [workoutCompletionId, user?.id]);

  useEffect(() => {
    if (initializationComplete && !initialLoadComplete) {
      console.log("Initialization complete - setting initialLoadComplete to true");
      setInitialLoadComplete(true);
    }
  }, [initializationComplete, initialLoadComplete]);

  useEffect(() => {
    console.log("State update - workout data:", !!workoutData);
    console.log("State update - workout exercises:", workoutExercises.length);
    console.log("State update - exercise states count:", Object.keys(exerciseStates || {}).length);
    console.log("State update - draft loaded:", draftLoaded);
    console.log("State update - initialization complete:", initializationComplete);
    
    if (workoutExercises.length > 0 && Object.keys(exerciseStates || {}).length > 0) {
      console.log("Exercise state availability check:");
      workoutExercises.forEach(ex => {
        console.log(`Exercise ${ex.id}: ${exerciseStates[ex.id] ? "State found" : "NO STATE FOUND"}`);
      });
    }
  }, [workoutData, workoutExercises, exerciseStates, draftLoaded, initializationComplete]);

  const toggleDescriptionExpanded = (exerciseId: string) => {
    setExpandedDescriptions(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const handleCompleteWorkout = async () => {
    try {
      let completionId = workoutData?.id;
      
      if (!completionId) {
        const { data: newCompletion, error: completionError } = await supabase
          .from('workout_completions')
          .insert({
            workout_id: workoutData?.workout_id || workoutCompletionId,
            standalone_workout_id: workoutData?.standalone_workout_id,
            user_id: user?.id,
            completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (completionError) {
          console.error("Error creating workout completion:", completionError);
          throw completionError;
        }
        
        if (!newCompletion) {
          throw new Error("Failed to create workout completion");
        }
        
        completionId = newCompletion.id;
      }

      const savePromises = [];
      
      for (const exerciseId of sortedExerciseIds) {
        if (!exerciseStates[exerciseId]) continue;
        
        const exerciseState = exerciseStates[exerciseId];
        const currentExercise = exerciseState.currentExercise;
        const exerciseType = currentExercise?.exercise_type || 'strength';
        
        if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
          if (exerciseState.sets && exerciseState.sets.length > 0) {
            exerciseState.sets.forEach((set, index) => {
              if (set.completed || (set.weight && set.reps)) {
                const setData = {
                  weight: parseFloat(set.weight) || null,
                  reps_completed: parseInt(set.reps) || null,
                  completed: set.completed || false,
                  notes: null
                };
                
                savePromises.push(
                  trackWorkoutSet(
                    exerciseId,
                    completionId,
                    set.setNumber,
                    setData
                  )
                );
              }
            });
          }
        } else if (exerciseType === 'cardio' && exerciseState.cardioData) {
          const cardioData = exerciseState.cardioData;
          if (cardioData.completed || cardioData.distance || cardioData.duration) {
            savePromises.push(
              trackWorkoutSet(
                exerciseId,
                completionId,
                1,
                {
                  distance: cardioData.distance || null,
                  duration: cardioData.duration || null,
                  location: cardioData.location || null,
                  completed: cardioData.completed || false,
                  notes: null
                }
              )
            );
          }
        } else if (exerciseType === 'flexibility' && exerciseState.flexibilityData) {
          const flexData = exerciseState.flexibilityData;
          if (flexData.completed || flexData.duration) {
            savePromises.push(
              trackWorkoutSet(
                exerciseId,
                completionId,
                1,
                {
                  duration: flexData.duration || null,
                  completed: flexData.completed || false,
                  notes: null
                }
              )
            );
          }
        } else if (isRunExercise(exerciseState) && exerciseState.runData) {
          const runData = exerciseState.runData;
          if (runData.completed || runData.distance || runData.duration) {
            savePromises.push(
              trackWorkoutSet(
                exerciseId,
                completionId,
                1,
                {
                  distance: runData.distance || null,
                  duration: runData.duration || null,
                  location: runData.location || null,
                  completed: runData.completed || false,
                  notes: null
                }
              )
            );
          }
        }
      }
      
      if (savePromises.length > 0) {
        console.log(`Saving ${savePromises.length} workout records...`);
        await Promise.all(savePromises);
        console.log(`Successfully saved ${savePromises.length} workout records`);
      }

      navigate(`/client-dashboard/workouts/complete/${completionId}`);
    } catch (error) {
      console.error("Error saving workout data:", error);
      toast.error("There was an error saving your workout data");
    }
  };

  const isRunExercise = (exerciseState: any) => {
    const exerciseName = exerciseState.currentExercise?.name || '';
    return exerciseName.toLowerCase().includes('run') || 
           exerciseName.toLowerCase().includes('running');
  };

  const formatDurationInput = (value: string): string => {
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue.length <= 2) {
      return numericValue;
    } else if (numericValue.length <= 4) {
      return `${numericValue.slice(0, 2)}:${numericValue.slice(2)}`;
    } else {
      return `${numericValue.slice(0, 2)}:${numericValue.slice(2, 4)}:${numericValue.slice(4, 6)}`;
    }
  };

  const handleSetChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseStates(prev => {
      const updatedSets = [...prev[exerciseId].sets];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value
      };
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          sets: updatedSets
        }
      };
    });
  };

  const handleSetCompletion = (exerciseId: string, setIndex: number, completed: boolean) => {
    setExerciseStates(prev => {
      const updatedSets = [...prev[exerciseId].sets];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        completed
      };
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          sets: updatedSets
        }
      };
    });
  };

  const handleCardioChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates(prev => {
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          cardioData: {
            ...prev[exerciseId].cardioData,
            [field]: value
          }
        }
      };
    });
  };

  const handleCardioCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates(prev => {
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          cardioData: {
            ...prev[exerciseId].cardioData,
            completed
          }
        }
      };
    });
  };

  const handleFlexibilityChange = (exerciseId: string, field: 'duration', value: string) => {
    setExerciseStates(prev => {
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          flexibilityData: {
            ...prev[exerciseId].flexibilityData,
            [field]: value
          }
        }
      };
    });
  };

  const handleFlexibilityCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates(prev => {
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          flexibilityData: {
            ...prev[exerciseId].flexibilityData,
            completed
          }
        }
      };
    });
  };

  const handleRunChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates(prev => {
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          runData: {
            ...prev[exerciseId].runData,
            [field]: value
          }
        }
      };
    });
  };

  const handleRunCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates(prev => {
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          runData: {
            ...prev[exerciseId].runData,
            completed
          }
        }
      };
    });
  };

  const handleVideoClick = (url: string, exerciseName: string) => {
    window.open(url, '_blank');
  };

  const handleSwapExercise = (updatedExercise: WorkoutExercise) => {
    const updatedExercises = [...workoutExercises];
    const exerciseIndex = updatedExercises.findIndex(ex => ex.id === updatedExercise.id);
    
    if (exerciseIndex !== -1) {
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        exercise: updatedExercise.exercise
      };
      
      setExerciseStates(prev => ({
        ...prev,
        [updatedExercise.id]: {
          ...prev[updatedExercise.id],
          exercise_id: updatedExercise.exercise?.id,
          currentExercise: updatedExercise.exercise
        }
      }));
      
      console.log("Exercise swapped in state:", {
        exerciseId: updatedExercise.id,
        newExerciseName: updatedExercise.exercise?.name,
        newExerciseId: updatedExercise.exercise?.id
      });
    }
  };

  const renderExerciseCard = (exercise: WorkoutExercise) => {
    if (!exercise || !exerciseStates || !exerciseStates[exercise.id]) {
      console.log(`No exercise state found for exercise with ID: ${exercise?.id}`);
      return null;
    }
    
    const { expanded } = exerciseStates[exercise.id];
    
    const currentExercise = exerciseStates[exercise.id].currentExercise || exercise.exercise;
    const exerciseName = currentExercise?.name || exercise.exercise?.name || '';
    const exerciseType = currentExercise?.exercise_type || exercise.exercise?.exercise_type || 'strength';
    const description = currentExercise?.description || exercise.exercise?.description || '';

    return (
      <Card key={exercise.id} className="mb-6">
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{exerciseName}</CardTitle>
              {description && !expandedDescriptions[exercise.id] && (
                <CardDescription className="mt-1 text-xs line-clamp-2">
                  {description}
                </CardDescription>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => toggleDescriptionExpanded(exercise.id)} 
              className="h-8 w-8"
            >
              <ChevronRight className={cn("h-5 w-5 transition-transform", expanded ? "rotate-90" : "")} />
            </Button>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0 px-3 pb-2">
            {description && (
              <div className={cn(
                "mb-4 text-sm rounded-md",
                expandedDescriptions[exercise.id] ? "bg-muted/50 p-3" : ""
              )}>
                {expandedDescriptions[exercise.id] && description}
              </div>
            )}
            
            {exerciseType === 'strength' && (
              <StrengthExercise 
                exercise={{
                  ...exercise,
                  exercise: currentExercise
                }}
                exerciseState={exerciseStates[exercise.id]}
                personalRecord={undefined}
                onSetChange={handleSetChange}
                onSetCompletion={handleSetCompletion}
                onVideoClick={handleVideoClick}
                onSwapClick={handleSwapExercise}
              />
            )}
            
            {exerciseType === 'cardio' && (
              <CardioExercise 
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                formatDurationInput={formatDurationInput}
                onCardioChange={handleCardioChange}
                onCardioCompletion={handleCardioCompletion}
                onVideoClick={handleVideoClick}
              />
            )}
            
            {exerciseType === 'flexibility' && (
              <FlexibilityExercise 
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                formatDurationInput={formatDurationInput}
                onFlexibilityChange={handleFlexibilityChange}
                onFlexibilityCompletion={handleFlexibilityCompletion}
                onVideoClick={handleVideoClick}
              />
            )}
            
            {(exerciseName.toLowerCase().includes('run') || exerciseName.toLowerCase().includes('running')) && (
              <RunExercise 
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                formatDurationInput={formatDurationInput}
                onRunChange={handleRunChange}
                onRunCompletion={handleRunCompletion}
                onVideoClick={handleVideoClick}
              />
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  const { saveStatus, errorCount, forceSave } = useAutosave({
    data: exerciseStates,
    onSave: async (data) => {
      const workoutId = getWorkoutId();
      
      if (!data || Object.keys(data).length === 0) {
        console.log("Skipping autosave - exercise states is empty");
        return false;
      }
      
      console.log(`Attempting to save workout draft for ID: ${workoutId}`, {
        dataSize: JSON.stringify(data).length,
        exerciseCount: Object.keys(data).length
      });
      return await saveWorkoutDraft(workoutId, 'workout', data);
    },
    debounce: 2000,
    minChanges: 1,
    disabled: !workoutData || !exerciseStates || Object.keys(exerciseStates).length === 0 || !initializationComplete
  });

  useEffect(() => {
    if (saveStatus === 'error') {
      if (autosaveRetries < 3) {
        console.log(`Autosave failed (attempt ${autosaveRetries + 1}/3). Will retry in 5 seconds...`);
        setTimeout(() => {
          setAutosaveRetries(prev => prev + 1);
          forceSave();
        }, 5000);
        
        if (autosaveRetries === 2) {
          toast.error('Failed to save workout progress. Please check your connection.');
        }
      } else {
        toast.error('Could not save workout progress automatically. Try completing your workout when connection improves.');
      }
    }
    
    if (saveStatus === 'saved') {
      setAutosaveRetries(0);
    }
  }, [saveStatus, autosaveRetries, forceSave]);

  if (isLoading || isDraftLoading) {
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
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Workout Not Found</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find the workout with ID: {workoutCompletionId}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            The workout may have been deleted or you may not have access to it.
          </p>
          <Button onClick={() => navigate('/client-dashboard/workouts')} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  const exerciseRenderReady = 
    initialLoadComplete && 
    Object.keys(exerciseStates || {}).length > 0 &&
    workoutExercises.every(ex => !!exerciseStates[ex.id]);
  
  const forceShowExercises = forceInitRef.current && workoutExercises.length > 0;

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-32">
      <div className="flex items-center mb-4 gap-2">
        <Button variant="ghost" onClick={() => navigate('/client-dashboard/workouts')} className="h-8 w-8 p-0 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{workoutData.workout?.title || "Workout"}</h1>
      </div>

      {workoutExercises.length > 0 ? (
        exerciseRenderReady || forceShowExercises ? (
          <div className="space-y-6">
            {workoutExercises.map(exercise => renderExerciseCard(exercise))}
            
            <div className="fixed bottom-14 left-0 right-0 z-40">
              <div className="bg-gradient-to-t from-background via-background to-transparent">
                <div className="container max-w-2xl mx-auto px-4">
                  <Stopwatch 
                    className="border-b border-border" 
                    saveStatus={saveStatus} 
                    workoutCompletionId={workoutCompletionId}
                  />
                  <Button 
                    onClick={handleCompleteWorkout}
                    className="w-full mt-3 mb-2 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Workout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] p-4">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-lg font-medium">Preparing workout...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Status: {workoutDataLoaded ? 'Workout data loaded' : 'Loading workout data'}, 
              {draftLoaded ? ' Draft loaded' : ' Loading draft'},
              {initializationComplete ? ' Initialization complete' : ' Initializing'}
            </p>
            <Button
              onClick={() => {
                console.log("Manual reload triggered by user");
                window.location.reload();
              }}
              variant="outline"
              className="mt-6"
            >
              <Loader2 className="h-4 w-4 mr-2" /> Reload Workout
            </Button>
          </div>
        )
      ) : (
        <div className="text-center py-8">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No Exercises Found</h3>
          <p className="text-muted-foreground">This workout doesn't have any exercises.</p>
          <Button 
            onClick={() => navigate('/client-dashboard/workouts')}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workouts
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActiveWorkout;
