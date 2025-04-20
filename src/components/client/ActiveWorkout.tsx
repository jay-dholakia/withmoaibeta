import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackWorkoutSet, fetchPersonalRecords } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, MapPin, Save, HelpCircle, Info, Youtube, Clock, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { saveWorkoutDraft, getWorkoutDraft, deleteWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { PersonalRecord, Exercise } from '@/types/workout';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { VideoPlayer } from '@/components/client/VideoPlayer';
import Stopwatch from './Stopwatch';
import { cn } from '@/lib/utils';
import { fetchSimilarExercises } from '@/services/exercise-service';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [authStateChanged, setAuthStateChanged] = useState(0);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [workoutDataInitialized, setWorkoutDataInitialized] = useState(false);
  
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

  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});
  
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentExerciseName, setCurrentExerciseName] = useState<string>('');

  const [alternativeDialogOpen, setAlternativeDialogOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [alternativeExercises, setAlternativeExercises] = useState<any[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);

  const formatDurationInput = (value: string): string => {
    let cleaned = value.replace(/[^\d:]/g, '');
    
    const parts = cleaned.split(':');
    
    if (parts.length > 3) {
      cleaned = parts.slice(0, 3).join(':');
    }
    
    return cleaned;
  };

  const formatRestTime = (seconds: number | null) => {
    if (!seconds) return "";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  useEffect(() => {
    if (user) {
      console.log("Auth state detected in ActiveWorkout, user:", user.id);
      setAuthStateChanged(prev => prev + 1);
    }
  }, [user]);

  useEffect(() => {
    const loadPersonalRecords = async () => {
      if (!user?.id) return;
      
      try {
        const records = await fetchPersonalRecords(user.id);
        console.log("Loaded personal records:", records);
        setPersonalRecords(records);
      } catch (error) {
        console.error("Error loading personal records:", error);
      }
    };
    
    loadPersonalRecords();
  }, [user?.id]);

  const getExercisePR = (exerciseId: string): PersonalRecord | undefined => {
    return personalRecords.find(record => record.exercise_id === exerciseId);
  };

  const draftData = {
    exerciseStates,
    pendingSets,
    pendingCardio,
    pendingFlexibility,
    pendingRuns
  };

  const { saveStatus } = useAutosave({
    data: draftData,
    onSave: async (data) => {
      if (!workoutCompletionId || !user?.id) return false;
      console.log("Saving workout draft with data:", data);
      return await saveWorkoutDraft(
        workoutCompletionId || null, 
        'workout', 
        data
      );
    },
    interval: 3000,
    disabled: !workoutCompletionId || !user?.id
  });

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
          .eq('id', workoutCompletionId || '')
          .eq('user_id', user?.id)
          .maybeSingle();
        
        if (completionError) {
          console.error("Error fetching workout data:", completionError);
        }
        
        if (completionData?.workout) {
          console.log("Found existing workout completion data:", completionData);
          return completionData;
        }
        
        console.log("Fetching workout directly with ID:", workoutCompletionId);
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
          
          const { data: standaloneWorkout, error: standaloneError } = await supabase
            .from('standalone_workouts')
            .select(`
              *,
              standalone_workout_exercises (
                *,
                exercise:exercise_id (*)
              )
            `)
            .eq('id', workoutCompletionId || '')
            .maybeSingle();
            
          if (standaloneError) {
            console.error("Error fetching standalone workout:", standaloneError);
            return null;
          }
          
          if (standaloneWorkout) {
            console.log("Found standalone workout:", standaloneWorkout);
            return {
              id: null,
              user_id: user?.id,
              workout_id: workoutCompletionId,
              standalone_workout_id: workoutCompletionId,
              completed_at: null,
              workout: {
                ...standaloneWorkout,
                workout_exercises: standaloneWorkout.standalone_workout_exercises?.map(ex => ({
                  ...ex,
                  workout_id: standaloneWorkout.id
                }))
              },
              workout_set_completions: []
            };
          }
          
          return null;
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
      } catch (error) {
        console.error("Error in workout data query:", error);
        throw error;
      }
    },
    enabled: !!workoutCompletionId && !!user?.id,
  });

  useEffect(() => {
    if (workoutData?.workout?.workout_exercises && !workoutDataInitialized) {
      console.log("Initializing workout exercise states from workout data");
      
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
          console.log(`Initializing exercise ${exercise.id}: ${exercise.exercise?.name} with ${exercise.sets} sets`);
          const sets = Array.from({ length: exercise.sets || 1 }, (_, i) => {
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
          console.log(`Created ${sets.length} sets for exercise ${exercise.id}`);
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
      
      console.log("Initialized exercise states:", initialState);
      setExerciseStates(initialState);
      setWorkoutDataInitialized(true);
    }
  }, [workoutData, workoutDataInitialized]);

  useEffect(() => {
    let mounted = true;
    
    const loadDraftData = async () => {
      if (!workoutCompletionId || !user?.id || !mounted) return;
      
      try {
        console.log(`Loading draft data for workout ${workoutCompletionId}`);
        
        const draft = await getWorkoutDraft(workoutCompletionId);
        
        if (!mounted) return;
        
        if (draft && draft.draft_data) {
          console.log("Workout draft data received:", draft.draft_data);
          
          if (typeof draft.draft_data === 'object' && draft.draft_data !== null) {
            if (workoutDataInitialized) {
              if (draft.draft_data.exerciseStates) {
                console.log("Loading exercise states from draft:", draft.draft_data.exerciseStates);
                setExerciseStates(prevStates => {
                  const mergedStates = { ...prevStates };
                  
                  Object.keys(draft.draft_data.exerciseStates).forEach(exerciseId => {
                    if (mergedStates[exerciseId]) {
                      mergedStates[exerciseId] = draft.draft_data.exerciseStates[exerciseId];
                    }
                  });
                  
                  return mergedStates;
                });
              }
            } else {
              console.log("Workout data not initialized yet, waiting to apply draft");
              return; // Don't mark as loaded until we can actually apply it
            }
            
            if (Array.isArray(draft.draft_data.pendingSets)) {
              console.log("Loading pending sets from draft:", draft.draft_data.pendingSets);
              setPendingSets(draft.draft_data.pendingSets);
            }
            
            if (Array.isArray(draft.draft_data.pendingCardio)) {
              console.log("Loading pending cardio from draft:", draft.draft_data.pendingCardio);
              setPendingCardio(draft.draft_data.pendingCardio);
            }
            
            if (Array.isArray(draft.draft_data.pendingFlexibility)) {
              console.log("Loading pending flexibility from draft:", draft.draft_data.pendingFlexibility);
              setPendingFlexibility(draft.draft_data.pendingFlexibility);
            }
            
            if (Array.isArray(draft.draft_data.pendingRuns)) {
              console.log("Loading pending runs from draft:", draft.draft_data.pendingRuns);
              setPendingRuns(draft.draft_data.pendingRuns);
            }
            
            console.log("Draft data successfully loaded");
            toast.success('Workout progress restored');
          }
        } else {
          console.log("No valid draft data found for this workout");
        }
      } catch (error) {
        console.error("Error loading workout draft:", error);
      } finally {
        if (mounted) {
          setDraftLoaded(true);
        }
      }
    };
    
    if (user && workoutCompletionId && !draftLoaded && workoutDataInitialized) {
      console.log("User authenticated and workout data initialized, loading draft data");
      loadDraftData();
    }
    
    return () => {
      mounted = false;
    };
  }, [workoutCompletionId, user, draftLoaded, workoutDataInitialized]);

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
        exerciseId,
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
          exerciseId,
          workoutCompletionId,
          setNumber,
          {
            weight: weight ? parseFloat(weight) : null,
            reps_completed: reps ? parseInt(reps, 10) : null,
            notes: notes || null,
            distance: distance || null,
            duration: duration || null,
            location: location || null,
            completed: true
          }
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
      if (!workoutCompletionId || !user?.id) {
        toast.error("Missing workout or user information");
        return null;
      }
      
      try {
        const { data: existingCompletion, error: checkError } = await supabase
          .from('workout_completions')
          .select('id')
          .eq('workout_id', workoutCompletionId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (checkError) {
          console.error("Error checking for existing completion:", checkError);
        }
        
        let completionId = existingCompletion?.id;
        
        if (!completionId) {
          console.log("Creating new workout completion record");
          const { data: newCompletion, error: insertError } = await supabase
            .from('workout_completions')
            .insert({
              workout_id: workoutData?.workout_id || workoutCompletionId,
              user_id: user.id,
              completed_at: new Date().toISOString()
            })
            .select('id')
            .single();
            
          if (insertError) {
            console.error("Error creating workout completion:", insertError);
            throw insertError;
          }
          
          completionId = newCompletion.id;
        } else {
          console.log("Using existing workout completion record:", completionId);
        }
        
        const promises = [];
        
        if (pendingSets.length > 0) {
          const setPromises = pendingSets.map(set => 
            trackWorkoutSet(
              set.exerciseId,
              completionId!,
              set.setNumber,
              {
                weight: set.weight ? parseFloat(set.weight) : null,
                reps_completed: set.reps ? parseInt(set.reps, 10) : null,
                completed: true
              }
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
              item.exerciseId,
              completionId!,
              1,
              {
                distance,
                duration: item.duration || null,
                location: item.location || null,
                completed: true
              }
            );
          });
          promises.push(...cardioPromises);
        }
        
        if (pendingFlexibility.length > 0) {
          const flexibilityPromises = pendingFlexibility.map(item => {
            return trackWorkoutSet(
              item.exerciseId,
              completionId!,
              1,
              {
                duration: item.duration || null,
                completed: true
              }
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
              item.exerciseId,
              completionId!,
              1,
              {
                distance,
                duration: item.duration || null,
                location: item.location || null,
                completed: true
              }
            );
          });
          promises.push(...runPromises);
        }
        
        if (promises.length > 0) {
          await Promise.allSettled(promises);
        } else {
          console.log("No sets were completed, just marking workout as completed");
        }
        
        return completionId;
      } catch (error) {
        console.error("Error in saveAllSetsMutation:", error);
        throw error;
      }
    },
    onSuccess: (completionId) => {
      if (completionId) {
        deleteWorkoutDraft(workoutCompletionId);
        
        queryClient.invalidateQueries({ queryKey: ['active-workout', workoutCompletionId] });
        queryClient.invalidateQueries({ queryKey: ['assigned-workouts'] });
        setPendingSets([]);
        setPendingCardio([]);
        setPendingFlexibility([]);
        setPendingRuns([]);
        navigate(`/client-dashboard/workouts/complete/${completionId}`);
      } else {
        toast.error("Failed to save workout");
      }
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
        const exerciseName = exercise.exercise?.name || '';
        const isRunExercise = exerciseName.toLowerCase().includes('run') || exerciseName.toLowerCase().includes('running');
        
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
          duration: runData.duration || '',
          location: runData.location || ''
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

  const toggleDescriptionExpanded = (exerciseId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const openVideoDialog = (url: string, exerciseName: string) => {
    if (url) {
      setCurrentVideoUrl(url);
      setCurrentExerciseName(exerciseName);
      setVideoDialogOpen(true);
    } else {
      toast.error("No video available for this exercise");
    }
  };

  const closeVideoDialog = () => {
    setVideoDialogOpen(false);
    setCurrentVideoUrl(null);
  };

  const openAlternativeDialog = async (exercise: any) => {
    setCurrentExercise(exercise);
    setAlternativeDialogOpen(true);
    setIsLoadingAlternatives(true);
    
    try {
      if (exercise.exercise?.muscle_group) {
        const alternatives = await fetchSimilarExercises(exercise.exercise.muscle_group);
        const filteredAlternatives = alternatives.filter(alt => alt.id !== exercise.exercise.id);
        setAlternativeExercises(filteredAlternatives);
      }
    } catch (error) {
      console.error('Error fetching alternative exercises:', error);
      toast.error('Failed to load alternative exercises');
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const closeAlternativeDialog = () => {
    setAlternativeDialogOpen(false);
    setCurrentExercise(null);
    setAlternativeExercises([]);
  };

  const handleExerciseSwap = (newExercise: Exercise, originalExerciseId: string) => {
    setExerciseStates(prev => {
      const updatedStates = { ...prev };
      
      // Find the exercise state to update
      const originalState = updatedStates[originalExerciseId];
      if (!originalState) return prev;
      
      // Only reset the specific exercise's sets while preserving everything else
      updatedStates[originalExerciseId] = {
        ...originalState,
        sets: originalState.sets.map(set => ({
          ...set,
          weight: '',
          reps: '',
          completed: false
        }))
      };
      
      return updatedStates;
    });
    
    // Update workout data to reflect the swap
    if (workoutData?.workout?.workout_exercises) {
      const exercises = workoutData.workout.workout_exercises;
      
      // Check if workout_exercises is an array before using map
      if (Array.isArray(exercises)) {
        const updatedExercises = exercises.map(ex => {
          if (ex.id === originalExerciseId) {
            return {
              ...ex,
              exercise: newExercise,
              exercise_id: newExercise.id
            };
          }
          return ex;
        });
        
        queryClient.setQueryData(['active-workout', workoutCompletionId], (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            workout: {
              ...oldData.workout,
              workout_exercises: updatedExercises
            }
          };
        });
      }
    }
    
    closeAlternativeDialog();
    toast.success(`Swapped to ${newExercise.name}`);
  };

  const renderExerciseCard = (exercise: any) => {
    const exerciseType = exercise.exercise?.exercise_type || 'strength';
    const exerciseName = exercise.exercise?.name || '';
    const isRunExercise = exerciseName.toLowerCase().includes('run') || exerciseName.toLowerCase().includes('running');
    const exerciseDescription = exercise.exercise?.description;
    const exerciseNotes = exercise.notes;
    const youtubeLink = exercise.exercise?.youtube_link;
    const personalRecord = getExercisePR(exercise.exercise?.id);

    if (!exerciseStates[exercise.id]) {
      return null;
    }

    const { expanded } = exerciseStates[exercise.id];

    return (
      <Card key={exercise.id} className="mb-6">
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {exerciseName}
              </CardTitle>
              {exercise.reps && !isRunExercise && exerciseType !== 'cardio' && exerciseType !== 'flexibility' && (
                <CardDescription>
                  {exercise.sets} {exercise.sets > 1 ? 'sets' : 'set'} x {exercise.reps} reps
                  {exercise.rest_seconds && ` • Rest: ${formatRestTime(exercise.rest_seconds)}`}
                </CardDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleExerciseExpanded(exercise.id)}
              className="h-8 w-8"
              aria-label={expanded ? "Collapse exercise" : "Expand exercise"}
            >
              <ChevronRight className={cn("h-5 w-5 transition-transform", expanded ? "rotate-90" : "")} />
            </Button>
          </div>
        </CardHeader>

        {expanded && (
          <>
            <CardContent className="pt-0 px-3 pb-2">
              {(exerciseDescription || exerciseNotes) && (
                <div className="mb-3 text-sm">
                  {expandedDescriptions[exercise.id] ? (
                    <div>
                      {exerciseDescription && <div className="mb-2">{exerciseDescription}</div>}
                      {exerciseNotes && (
                        <div className="mt-2">
                          <span className="font-semibold">Coach's notes:</span> {exerciseNotes}
                        </div>
                      )}
                      {(exerciseDescription || exerciseNotes) && (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs" 
                          onClick={() => toggleDescriptionExpanded(exercise.id)}
                        >
                          Show Less
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-xs" 
                      onClick={() => toggleDescriptionExpanded(exercise.id)}
                    >
                      Show Description
                    </Button>
                  )}
                </div>
              )}

              {isRunExercise && exerciseStates[exercise.id].runData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Distance (miles)</label>
                      <Input 
                        type="number" 
                        placeholder="Enter distance"
                        value={exerciseStates[exercise.id].runData?.distance || ''}
                        onChange={(e) => handleRunChange(exercise.id, 'distance', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Duration (hh:mm:ss)</label>
                      <Input 
                        type="text"
                        placeholder="00:30:00"
                        value={exerciseStates[exercise.id].runData?.duration || ''}
                        onChange={(e) => handleRunChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Location (optional)</label>
                    <Input 
                      type="text" 
                      placeholder="e.g., Central Park"
                      value={exerciseStates[exercise.id].runData?.location || ''}
                      onChange={(e) => handleRunChange(exercise.id, 'location', e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            <Checkbox 
                              id={`run-done-${exercise.id}`}
                              checked={exerciseStates[exercise.id].runData?.completed}
                              onCheckedChange={(checked) => handleRunCompletion(exercise.id, checked === true)}
                              className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                            />
                            <label htmlFor={`run-done-${exercise.id}`} className="ml-2 cursor-pointer">
                              Mark as Done
                            </label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark this run as completed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {youtubeLink && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openVideoDialog(youtubeLink, exerciseName)}
                      >
                        <Youtube className="h-4 w-4 mr-1" /> Demo
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {exerciseType === 'cardio' && !isRunExercise && exerciseStates[exercise.id].cardioData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Distance (optional)</label>
                      <Input 
                        type="text" 
                        placeholder="e.g., 5 miles"
                        value={exerciseStates[exercise.id].cardioData?.distance || ''}
                        onChange={(e) => handleCardioChange(exercise.id, 'distance', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Duration (hh:mm:ss)</label>
                      <Input 
                        type="text"
                        placeholder="00:30:00"
                        value={exerciseStates[exercise.id].cardioData?.duration || ''}
                        onChange={(e) => handleCardioChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Location (optional)</label>
                    <Input 
                      type="text" 
                      placeholder="e.g., Gym"
                      value={exerciseStates[exercise.id].cardioData?.location || ''}
                      onChange={(e) => handleCardioChange(exercise.id, 'location', e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            <Checkbox 
                              id={`cardio-done-${exercise.id}`}
                              checked={exerciseStates[exercise.id].cardioData?.completed}
                              onCheckedChange={(checked) => handleCardioCompletion(exercise.id, checked === true)}
                              className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                            />
                            <label htmlFor={`cardio-done-${exercise.id}`} className="ml-2 cursor-pointer">
                              Mark as Done
                            </label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark this cardio session as completed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {youtubeLink && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openVideoDialog(youtubeLink, exerciseName)}
                      >
                        <Youtube className="h-4 w-4 mr-1" /> Demo
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {exerciseType === 'flexibility' && exerciseStates[exercise.id].flexibilityData && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs mb-1">Duration (mm:ss)</label>
                    <Input 
                      type="text"
                      placeholder="05:00"
                      value={exerciseStates[exercise.id].flexibilityData?.duration || ''}
                      onChange={(e) => handleFlexibilityChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            <Checkbox 
                              id={`flexibility-done-${exercise.id}`}
                              checked={exerciseStates[exercise.id].flexibilityData?.completed}
                              onCheckedChange={(checked) => handleFlexibilityCompletion(exercise.id, checked === true)}
                              className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                            />
                            <label htmlFor={`flexibility-done-${exercise.id}`} className="ml-2 cursor-pointer">
                              Mark as Done
                            </label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark this flexibility exercise as completed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {youtubeLink && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openVideoDialog(youtubeLink, exerciseName)}
                      >
                        <Youtube className="h-4 w-4 mr-1" /> Demo
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {(exerciseType === 'strength' || exerciseType === 'bodyweight') && !isRunExercise && (
                <div className="space-y-3">
                  {personalRecord && (
                    <div className="bg-gray-50 p-2 rounded-md text-xs flex items-center mb-2">
                      <Info className="h-4 w-4 mr-1.5 text-blue-500" />
                      <span>
                        <span className="font-semibold">PR:</span> {personalRecord.weight} lbs x {personalRecord.reps || 1} {personalRecord.reps !== 1 ? 'reps' : 'rep'}
                      </span>
                    </div>
                  )}

                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500">
                        <th className="text-left font-normal">Set</th>
                        <th className="text-left font-normal">Reps</th>
                        <th className="text-left font-normal">Weight</th>
                        <th className="text-center font-normal w-12">Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exerciseStates[exercise.id].sets.map((set, index) => (
                        <tr key={`${exercise.id}-set-${index}`} className="h-10">
                          <td className="pl-1 w-8 text-sm">{set.setNumber}</td>
                          <td className="pr-1 w-24">
                            <Input
                              type="number"
                              placeholder="reps"
                              value={set.reps}
                              onChange={(e) => handleSetChange(exercise.id, index, 'reps', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </td>
                          <td className="pr-1 w-24">
                            <Input
                              type="number"
                              placeholder="lbs"
                              value={set.weight}
                              onChange={(e) => handleSetChange(exercise.id, index, 'weight', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </td>
                          <td className="text-center">
                            <Checkbox 
                              id={`set-${exercise.id}-${index}`}
                              checked={set.completed}
                              onCheckedChange={(checked) => handleSetCompletion(exercise.id, index, checked === true)}
                              className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="flex justify-end mt-2 space-x-2">
                    {youtubeLink && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openVideoDialog(youtubeLink, exerciseName)}
                      >
                        <Youtube className="h-4 w-4 mr-1" /> Demo
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openAlternativeDialog(exercise)}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-1" /> Swap
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </>
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
        <p className="text-gray-500 text-center mb-6">Could not load the requested workout.</p>
        <Button onClick={() => navigate('/client-dashboard/workouts')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workouts
        </Button>
      </div>
    );
  }

  const workout = workoutData.workout;
  const exercises = Array.isArray(workout.workout_exercises) ? workout.workout_exercises : [];
  
  // Sort exercises by their order_index if available
  const sortedExercises = [...exercises].sort((a, b) => {
    return (a.order_index || 0) - (b.order_index || 0);
  });

  // Workout completion state
  const hasCompletedWorkout = Object.values(exerciseStates).some(state => {
    if (state.cardioData?.completed) return true;
    if (state.flexibilityData?.completed) return true;
    if (state.runData?.completed) return true;
    return state.sets?.some(set => set.completed);
  });

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 p-4 border-b shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-2 pl-0"
              onClick={() => navigate('/client-dashboard/workouts')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold">{workout.title}</h1>
            {workout.description && (
              <p className="text-gray-600 text-sm mt-1">{workout.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-32">
        {/* Exercises */}
        {sortedExercises.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p>No exercises found for this workout.</p>
          </div>
        ) : (
          sortedExercises.map(exercise => renderExerciseCard(exercise))
        )}
        
        {/* Complete Workout Button */}
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t z-50">
          <div className="p-4">
            <Stopwatch className="mb-4" />
            <Button 
              disabled={!hasCompletedWorkout || saveAllSetsMutation.isPending}
              onClick={() => saveAllSetsMutation.mutate()}
              className="w-full h-12"
            >
              {saveAllSetsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Complete Workout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Video Demo Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={closeVideoDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentExerciseName} Demo</DialogTitle>
          </DialogHeader>
          {currentVideoUrl && <VideoPlayer url={currentVideoUrl} />}
        </DialogContent>
      </Dialog>
      
      {/* Alternative Exercises Dialog */}
      <Dialog open={alternativeDialogOpen} onOpenChange={closeAlternativeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Alternative Exercises</DialogTitle>
            <DialogDescription>
              Click on an exercise to swap it with {currentExercise?.exercise?.name}. This will reset any logged sets.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingAlternatives ? (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="mt-2">Loading alternatives...</p>
            </div>
          ) : alternativeExercises.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No alternative exercises found for this muscle group.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {alternativeExercises.map(alt => (
                <Card 
                  key={alt.id} 
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleExerciseSwap(alt, currentExercise?.id)}
                >
                  <h4 className="font-medium">{alt.name}</h4>
                  {alt.description && (
                    <p className="text-sm text-muted-foreground mt-1">{alt.description}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeAlternativeDialog}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
