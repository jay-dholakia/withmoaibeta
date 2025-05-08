import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackWorkoutSet, fetchPersonalRecords } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, Save, HelpCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
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
import CardioWorkout from './workout/CardioWorkout';
import { PendingCardio } from '@/types/active-workout';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Initialize all state variables at the top level
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [retryCount, setRetryCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [workoutDataLoaded, setWorkoutDataLoaded] = useState(false);
  const [autosaveRetries, setAutosaveRetries] = useState<number>(0);
  const [pendingCardio, setPendingCardio] = useState<PendingCardio[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionProcessed, setCompletionProcessed] = useState(false);

  // All refs should be initialized at the top level
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initCompleteForceCounter = useRef<number>(0);
  const forceInitRef = useRef<boolean>(false);

  // Always fetch personal records, regardless of rendering conditions
  const { data: personalRecords = [] } = useQuery({
    queryKey: ['personal-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const records = await fetchPersonalRecords(user.id);
        console.log("Fetched personal records:", records);
        return records;
      } catch (error) {
        console.error('Error fetching personal records:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

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

  const { draftData, draftLoaded, isLoading: isDraftLoading, updateExerciseExpansionState } = useWorkoutDraft({
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

  const toggleExerciseExpanded = (exerciseId: string) => {
    if (!exerciseStates[exerciseId]) return;
    
    const newExpandedState = !exerciseStates[exerciseId].expanded;
    
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        expanded: newExpandedState
      }
    }));
    
    updateExerciseExpansionState(exerciseId, newExpandedState);
  };

  const handleCompleteWorkout = async () => {
    // Prevent duplicate submissions
    if (isSubmitting || completionProcessed) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Check if the workout is already completed
      if (workoutData?.id) {
        const { data: existingCompletion, error: checkError } = await supabase
          .from('workout_completions')
          .select('id')
          .eq('id', workoutData.id)
          .eq('user_id', user?.id)
          .maybeSingle();
          
        if (existingCompletion) {
          console.log('Workout already completed, navigating to completion page');
          setCompletionProcessed(true);
          navigate(`/client-dashboard/workouts/complete/${existingCompletion.id}`);
          return;
        }
      }

      let completionId = workoutData?.id;
      
      // Determine the workout type
      const defaultWorkoutType = workoutData?.workout?.workout_type || 'strength';
      
      if (!completionId) {
        const { data: newCompletion, error: completionError } = await supabase
          .from('workout_completions')
          .insert({
            workout_id: workoutData?.workout_id || workoutCompletionId,
            standalone_workout_id: workoutData?.standalone_workout_id,
            user_id: user?.id,
            completed_at: new Date().toISOString(),
            workout_type: defaultWorkoutType // Ensure workout_type is set to the default or "strength"
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
      } else {
        // If completion already exists, ensure workout_type is set correctly
        const { error: updateError } = await supabase
          .from('workout_completions')
          .update({
            workout_type: defaultWorkoutType,
            completed_at: new Date().toISOString()
          })
          .eq('id', completionId);
          
        if (updateError) {
          console.error("Error updating workout completion type:", updateError);
        }
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

      setCompletionProcessed(true);
      navigate(`/client-dashboard/workouts/complete/${completionId}`);
    } catch (error) {
      console.error("Error saving workout data:", error);
      toast.error("There was an error saving your workout data");
    } finally {
      setIsSubmitting(false);
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
      const updatedState = { ...prev };
      if (!updatedState[exerciseId]) {
        updatedState[exerciseId] = {
          expanded: true,
          sets: [],
          cardioData: {
            distance: '',
            duration: '',
            location: '',
            completed: false,
            workout_type: 'cardio'
          }
        };
      }
      
      if (!updatedState[exerciseId].cardioData) {
        updatedState[exerciseId].cardioData = {
          distance: '',
          duration: '',
          location: '',
          completed: false,
          workout_type: 'cardio'
        };
      }
      
      updatedState[exerciseId].cardioData![field] = value;
      return updatedState;
    });
    
    if (field === 'distance' || field === 'duration') {
      // Add cardio to pending changes
      const existingCardioIndex = pendingCardio.findIndex(p => p.exerciseId === exerciseId);
      
      if (existingCardioIndex >= 0) {
        setPendingCardio(prev => {
          const updated = [...prev];
          updated[existingCardioIndex] = {
            ...updated[existingCardioIndex],
            [field]: value
          };
          return updated;
        });
      } else {
        setPendingCardio(prev => [
          ...prev,
          {
            exerciseId,
            distance: field === 'distance' ? value : exerciseStates[exerciseId]?.cardioData?.distance || '',
            duration: field === 'duration' ? value : exerciseStates[exerciseId]?.cardioData?.duration || '',
            location: exerciseStates[exerciseId]?.cardioData?.location || '',
            completed: exerciseStates[exerciseId]?.cardioData?.completed || false,
            workout_type: 'cardio'
          }
        ]);
      }
    }
  };

  const handleCardioCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates(prev => {
      const updatedState = { ...prev };
      
      if (!updatedState[exerciseId]) {
        updatedState[exerciseId] = {
          expanded: true,
          sets: [],
          cardioData: {
            distance: '',
            duration: '',
            location: '',
            completed: false,
            workout_type: 'cardio'
          }
        };
      }
      
      if (!updatedState[exerciseId].cardioData) {
        updatedState[exerciseId].cardioData = {
          distance: '',
          duration: '',
          location: '',
          completed: false,
          workout_type: 'cardio'
        };
      }
      
      updatedState[exerciseId].cardioData!.completed = completed;
      return updatedState;
    });
    
    // Update pending cardio
    const existingCardioIndex = pendingCardio.findIndex(p => p.exerciseId === exerciseId);
    
    if (existingCardioIndex >= 0) {
      setPendingCardio(prev => {
        const updated = [...prev];
        updated[existingCardioIndex] = {
          ...updated[existingCardioIndex],
          completed
        };
        return updated;
      });
    } else {
      const currentState = exerciseStates[exerciseId]?.cardioData;
      
      setPendingCardio(prev => [
        ...prev,
        {
          exerciseId,
          distance: currentState?.distance || '',
          duration: currentState?.duration || '',
          location: currentState?.location || '',
          completed,
          workout_type: 'cardio'
        }
      ]);
    }
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

  const handleVideoClick = (url: string) => {
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

  const isStrengthExercise = (exercise: any): boolean => {
    if (!exercise || !exercise.currentExercise) return true; // Default to strength
    
    const exerciseType = exercise.currentExercise.exercise_type || '';
    const exerciseName = (exercise.currentExercise.name || '').toLowerCase();
    const exerciseMuscleGroup = (exercise.currentExercise.muscle_group || '').toLowerCase();
    
    // List of terms commonly found in strength exercise names
    const strengthTerms = [
      'press', 'bench', 'squat', 'curl', 'row', 'deadlift',
      'overhead', 'barbell', 'dumbbell', 'machine', 'cable',
      'pushup', 'pullup', 'chinup', 'extension', 'flexion',
      'raise', 'fly', 'flye', 'lateral', 'front', 'pushdown'
    ];
    
    // Check if name contains common strength exercise terms
    if (strengthTerms.some(term => exerciseName.includes(term))) {
      return true;
    }
    
    // Check muscle group
    if (
      exerciseMuscleGroup.includes('chest') ||
      exerciseMuscleGroup.includes('back') ||
      exerciseMuscleGroup.includes('leg') ||
      exerciseMuscleGroup.includes('arm') ||
      exerciseMuscleGroup.includes('shoulder') ||
      exerciseMuscleGroup.includes('tricep') ||
      exerciseMuscleGroup.includes('bicep') ||
      exerciseMuscleGroup.includes('quad') ||
      exerciseMuscleGroup.includes('hamstring')
    ) {
      return true;
    }
    
    // Check exercise type
    if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
      return true;
    }
    
    return false;
  };

  // Function to find a personal record for a specific exercise
  const findPersonalRecord = (exerciseId: string): PersonalRecord | undefined => {
    if (!personalRecords || personalRecords.length === 0 || !exerciseId) return undefined;
    
    console.log(`Looking for PR for exercise: ${exerciseId} in ActiveWorkout`);
    const record = personalRecords.find(pr => pr.exercise_id === exerciseId);
    if (record) {
      console.log(`Found PR:`, record);
    }
    
    return record;
  };

  const renderExerciseCard = (exercise: WorkoutExercise) => {
    if (!exercise) {
      console.log(`Cannot render null or undefined exercise`);
      return null;
    }
    
    if (!exerciseStates || !exerciseStates[exercise.id]) {
      console.log(`No exercise state found for exercise with ID: ${exercise.id}. Creating fallback state.`);
      
      const fallbackState = {
        expanded: true,
        exercise_id: exercise.exercise?.id,
        currentExercise: exercise.exercise,
        sets: Array.from({ length: exercise.sets || 1 }, (_, i) => ({
          setNumber: i + 1,
          weight: '',
          reps: exercise.reps || '',
          completed: false,
        })),
      };
      
      setExerciseStates(prev => ({
        ...prev,
        [exercise.id]: fallbackState
      }));
      
      return null;
    }
    
    const { expanded } = exerciseStates[exercise.id];
    
    const currentExercise = exerciseStates[exercise.id].currentExercise || exercise.exercise;
    const exerciseName = currentExercise?.name || exercise.exercise?.name || '';
    const exerciseType = currentExercise?.exercise_type || exercise.exercise?.exercise_type || 'strength';
    const description = currentExercise?.description || exercise.exercise?.description || '';

    // Check for "press" in the exercise name for debugging
    if (exerciseName.toLowerCase().includes('press')) {
      console.log(`Press exercise detected: ${exerciseName}`, {
        exerciseId: exercise.id,
        exerciseType: exerciseType,
        sets: exerciseStates[exercise.id].sets?.length,
        isStrengthByFunction: isStrengthExercise(exerciseStates[exercise.id])
      });
    }

    return (
      <Card key={exercise.id} className="mb-6">
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{exerciseName}</CardTitle>
              {description && (
                <CardDescription className="mt-1 text-xs">
                  {description}
                </CardDescription>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => toggleExerciseExpanded(exercise.id)} 
              className="h-8 w-8"
            >
              {expanded ? 
                <ChevronUp className="h-5 w-5 transition-transform" /> : 
                <ChevronDown className="h-5 w-5 transition-transform" />
              }
            </Button>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0 px-3 pb-2">
            {(exerciseType === 'strength' || isStrengthExercise(exerciseStates[exercise.id])) && (
              <StrengthExercise 
                exercise={{
                  ...exercise,
                  exercise: currentExercise
                }}
                exerciseState={exerciseStates[exercise.id]}
                personalRecord={currentExercise && currentExercise.id ? findPersonalRecord(currentExercise.id) : undefined}
                onSetChange={handleSetChange}
                onSetCompletion={handleSetCompletion}
                onVideoClick={handleVideoClick}
                onSwapClick={handleSwapExercise}
              />
            )}
            
            {exerciseType === 'cardio' && !isStrengthExercise(exerciseStates[exercise.id]) && (
              <CardioExercise 
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                formatDurationInput={formatDurationInput}
                onCardioChange={handleCardioChange}
                onCardioCompletion={handleCardioCompletion}
                onVideoClick={handleVideoClick}
              />
            )}
            
            {exerciseType === 'flexibility' && !isStrengthExercise(exerciseStates[exercise.id]) && (
              <FlexibilityExercise 
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                formatDurationInput={formatDurationInput}
                onFlexibilityChange={handleFlexibilityChange}
                onFlexibilityCompletion={handleFlexibilityCompletion}
                onVideoClick={handleVideoClick}
              />
            )}
            
            {isRunExercise(exerciseStates[exercise.id]) && (
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
        console.log(`Autosave failed (attempt ${autosaveRetries + 1}/3). Will retry in 5 seconds.`);
        setAutosaveRetries(prev => prev + 1);
        
        // Try to save again after 5 seconds
        setTimeout(() => {
          if (initializationComplete && exerciseStates && Object.keys(exerciseStates).length > 0) {
            console.log("Retrying autosave...");
            forceSave();
          }
        }, 5000);
      } else {
        console.error("Multiple autosave attempts failed. Please try saving manually.");
        toast.error("Failed to save your progress automatically");
        // Reset retry counter after showing error message
        setAutosaveRetries(0);
      }
    } else if (saveStatus === 'saved') {
      // Reset retry counter after successful save
      setAutosaveRetries(0);
    }
  }, [saveStatus, autosaveRetries, exerciseStates, initializationComplete, forceSave]);

  // Display loading state
  if (isLoading || !initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Loading workout...</p>
        <p className="text-sm text-muted-foreground">Please wait while we prepare your workout</p>
      </div>
    );
  }

  // Display error state
  if (error || !workoutData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium">Error loading workout</p>
        <p className="text-sm text-muted-foreground mb-4">Unable to load workout details</p>
        <Button 
          variant="outline" 
          onClick={() => {
            setRetryCount(prev => prev + 1);
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
        <Button 
          variant="link" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="mt-2"
        >
          Return to workouts
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/client-dashboard/workouts')}
        className="mb-4 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workouts
      </Button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {workoutData?.workout?.title || 'Workout'}
        </h1>
        <p className="text-muted-foreground">
          Track your progress as you complete each exercise
        </p>
      </div>
      
      {saveStatus === 'saving' && (
        <div className="mb-4 p-2 bg-muted/50 rounded-md flex items-center gap-2 text-sm text-muted-foreground">
          <Save className="h-4 w-4 animate-pulse" />
          Saving your progress...
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="mb-4 p-2 bg-destructive/10 rounded-md flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Failed to save your progress. 
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceSave}
            className="ml-2 h-7 px-2 text-xs"
          >
            Try Again
          </Button>
        </div>
      )}
      
      {workoutExercises.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No exercises found for this workout</p>
      ) : (
        <div className="space-y-6 mb-24">
          {workoutExercises.map(exercise => renderExerciseCard(exercise))}
        </div>
      )}
      
      {/* Fixed position timer and complete workout button */}
      <div className="fixed bottom-14 left-0 right-0 z-50 px-4 flex flex-col gap-2">
        <Stopwatch 
          className="w-full" 
          workoutCompletionId={workoutCompletionId} 
          saveStatus={saveStatus} 
        />
        
        <Button 
          onClick={handleCompleteWorkout}
          className="w-full py-5 bg-client hover:bg-client/90 shadow-lg"
          disabled={isSubmitting || completionProcessed}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          )}
          Complete Workout
        </Button>
      </div>
    </div>
  );
};

export default ActiveWorkout;
