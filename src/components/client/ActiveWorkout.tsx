import React, { useState, useEffect, useRef } from 'react';
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
import { PersonalRecord } from '@/types/workout';
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
import { updateWorkoutCompletion } from '@/services/workout-edit-service';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [authStateChanged, setAuthStateChanged] = useState(0);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  
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
    let mounted = true;
    let loadAttemptTimeout: NodeJS.Timeout | null = null;
    
    const loadDraftData = async () => {
      if (!workoutCompletionId || !user?.id || !mounted || draftLoaded) return;
      
      try {
        console.log(`Loading draft data for workout ${workoutCompletionId}`);
        console.log(`Auth state changes detected: ${authStateChanged}`);
        
        const draft = await getWorkoutDraft(workoutCompletionId, 7, 500);
        
        if (!mounted) return;
        
        if (draft && draft.draft_data) {
          console.log("Workout draft data received:", draft.draft_data);
          
          if (typeof draft.draft_data === 'object' && draft.draft_data !== null) {
            let newExerciseStates = {...exerciseStates};
            
            if (draft.draft_data.exerciseStates && Object.keys(draft.draft_data.exerciseStates).length > 0) {
              console.log(`Loading ${Object.keys(draft.draft_data.exerciseStates).length} exercise states from draft`);
              newExerciseStates = {
                ...newExerciseStates,
                ...draft.draft_data.exerciseStates
              };
            }
            
            if (Array.isArray(draft.draft_data.pendingSets) && draft.draft_data.pendingSets.length > 0) {
              console.log(`Loading ${draft.draft_data.pendingSets.length} pending sets from draft`);
              setPendingSets(draft.draft_data.pendingSets);
            }
            
            if (Array.isArray(draft.draft_data.pendingCardio) && draft.draft_data.pendingCardio.length > 0) {
              console.log(`Loading ${draft.draft_data.pendingCardio.length} pending cardio from draft`);
              setPendingCardio(draft.draft_data.pendingCardio);
            }
            
            if (Array.isArray(draft.draft_data.pendingFlexibility) && draft.draft_data.pendingFlexibility.length > 0) {
              console.log(`Loading ${draft.draft_data.pendingFlexibility.length} pending flexibility from draft`);
              setPendingFlexibility(draft.draft_data.pendingFlexibility);
            }
            
            if (Array.isArray(draft.draft_data.pendingRuns) && draft.draft_data.pendingRuns.length > 0) {
              console.log(`Loading ${draft.draft_data.pendingRuns.length} pending runs from draft`);
              setPendingRuns(draft.draft_data.pendingRuns);
            }
            
            console.log("Draft data successfully loaded and applied to component state");
            toast.success('Workout progress restored');
          } else {
            console.warn("Draft data is not a valid object:", draft.draft_data);
          }
        } else {
          console.log("No valid draft data found for this workout");
        }
      } catch (error) {
        console.error("Error loading workout draft:", error);
      } finally {
        setDraftLoaded(true);
      }
    };
    
    if (user && workoutCompletionId && !draftLoaded) {
      console.log("User authenticated, loading draft data");
      loadDraftData();
    } else if (!user && workoutCompletionId && !draftLoaded) {
      console.log("User not authenticated yet, scheduling retry");
      loadAttemptTimeout = setTimeout(() => {
        if (mounted && !draftLoaded) {
          console.log("Retrying workout draft load after timeout");
          loadDraftData();
        }
      }, 1500);
    }
    
    return () => {
      mounted = false;
      if (loadAttemptTimeout) {
        clearTimeout(loadAttemptTimeout);
      }
    };
  }, [workoutCompletionId, user, draftLoaded, authStateChanged]);

  useEffect(() => {
    if (workoutData?.workout?.workout_exercises && !draftLoaded) {
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
  }, [workoutData, draftLoaded]);

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

  const openVideoDialog = (url: string | undefined, exerciseName: string) => {
    if (url) {
      setCurrentVideoUrl(url);
      setCurrentExerciseName(exerciseName);
      setVideoDialogOpen(true);
    } else {
      toast.error('No video available for this exercise');
    }
  };

  const fetchAlternativeExercises = async (exerciseId: string) => {
    try {
      const { data: alternatives, error } = await supabase
        .rpc('get_exercise_alternatives', { exercise_id_param: exerciseId });

      if (error) {
        console.error("Error fetching alternative exercises:", error);
        return [];
      }

      console.log("Alternative exercises:", alternatives);
      return alternatives || [];
    } catch (error) {
      console.error("Error in fetchAlternativeExercises:", error);
      return [];
    }
  };

  const openAlternativeDialog = async (exercise: any) => {
    setCurrentExercise(exercise);
    
    const alternatives = await fetchAlternativeExercises(exercise.exercise_id);
    
    if (!alternatives || alternatives.length === 0) {
      toast.info('No alternative exercises available');
      return;
    }
    
    setAlternativeExercises(alternatives);
    setAlternativeDialogOpen(true);
  };

  const handleAlternativeSelection = async (alternativeId: string, alternativeName: string) => {
    if (!currentExercise) return;

    try {
      const updatedExerciseState = { ...exerciseStates[currentExercise.id] };
      
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', alternativeId)
        .single();
      
      if (exerciseError) {
        console.error("Error fetching alternative exercise details:", exerciseError);
        toast.error('Could not load alternative exercise');
        return;
      }
      
      const updatedWorkoutData = { ...workoutData };
      if (updatedWorkoutData?.workout?.workout_exercises) {
        const workoutExercises = Array.isArray(updatedWorkoutData.workout.workout_exercises) 
          ? updatedWorkoutData.workout.workout_exercises 
          : [];
          
        const exerciseIndex = workoutExercises.findIndex(
          (ex: any) => ex.id === currentExercise.id
        );
        
        if (exerciseIndex !== -1) {
          const exerciseToUpdate = workoutExercises[exerciseIndex];
          if (exerciseToUpdate && typeof exerciseToUpdate === 'object') {
            exerciseToUpdate.exercise = {
              id: alternativeId,
              name: alternativeName,
              youtube_link: exerciseData.youtube_link || null,
              description: exerciseData.description || null,
              exercise_type: exerciseData.exercise_type || 'strength',
              category: exerciseData.category || '',
              log_type: exerciseData.log_type || 'weight_reps',
              created_at: exerciseData.created_at || new Date().toISOString(),
              alternative_exercise_1_id: exerciseData.alternative_exercise_1_id || null,
              alternative_exercise_2_id: exerciseData.alternative_exercise_2_id || null,
              alternative_exercise_3_id: exerciseData.alternative_exercise_3_id || null
            };
          }
        }
      }
      
      setAlternativeDialogOpen(false);
      toast.success(`Switched to ${alternativeName}`);
      
    } catch (error) {
      console.error("Error selecting alternative exercise:", error);
      toast.error('Failed to switch exercise');
    }
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

  const saveAllSetsMutation = useMutation({
    mutationFn: async () => {
      if (!workoutCompletionId || !user?.id) {
        throw new Error("Missing workout completion ID or user ID");
      }
      
      try {
        await updateWorkoutCompletion(workoutCompletionId, {
          completed_at: new Date().toISOString()
        });
        
        for (const pendingSet of pendingSets) {
          await trackWorkoutSet({
            workoutCompletionId,
            exerciseId: pendingSet.exerciseId,
            setNumber: pendingSet.setNumber,
            weight: pendingSet.weight,
            repsCompleted: pendingSet.reps,
            completed: true
          });
        }
        
        for (const cardio of pendingCardio) {
          await trackWorkoutSet({
            workoutCompletionId,
            exerciseId: cardio.exerciseId,
            setNumber: 1,
            distance: cardio.distance,
            duration: cardio.duration,
            location: cardio.location,
            completed: true
          });
        }
        
        for (const flexibility of pendingFlexibility) {
          await trackWorkoutSet({
            workoutCompletionId,
            exerciseId: flexibility.exerciseId,
            setNumber: 1,
            duration: flexibility.duration,
            completed: true
          });
        }
        
        for (const run of pendingRuns) {
          await trackWorkoutSet({
            workoutCompletionId,
            exerciseId: run.exerciseId,
            setNumber: 1,
            distance: run.distance,
            duration: run.duration,
            location: run.location,
            completed: true
          });
        }
        
        await deleteWorkoutDraft(workoutCompletionId);
        
        navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
        
        return true;
      } catch (error) {
        console.error("Error saving workout data:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-history'] });
      queryClient.invalidateQueries({ queryKey: ['personal-records'] });
      toast.success('Workout completed successfully!');
    },
    onError: (error) => {
      console.error("Error completing workout:", error);
      toast.error('Failed to complete workout. Please try again.');
    }
  });

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
    
  const isStrengthWorkout = workoutData.workout?.workout_type === 'strength';

  return (
    <div className="space-y-6 pb-28 w-full max-w-screen-xl mx-auto px-4 md:px-6">
      <div className="flex flex-col items-center gap-2 text-center w-full">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="border border-gray-200 hover:border-gray-300 self-start mb-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{workoutData?.workout?.title || 'Workout'}</h1>
        <p className="text-muted-foreground">Track your progress</p>
        
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'success' && (
            <>
              <Save className="h-3 w-3" />
              <span>Draft saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="h-3 w-3 text-destructive" />
              <span className="text-destructive">Save failed</span>
            </>
          )}
        </div>
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

          const personalRecord = getExercisePR(exercise.exercise?.id);
          
          const hasYoutubeLink = exercise.exercise?.youtube_link && exercise.exercise.youtube_link.trim() !== '';
          
          return (
            <Card key={exercise.id} className="overflow-hidden border-gray-200 w-full">
              <CardHeader 
                className="cursor-pointer bg-client/5 text-center relative" 
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium flex items-center justify-center gap-2">
                      {exercise.exercise?.name || 'Exercise'}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {(exerciseType === 'strength' || exerciseType === 'bodyweight') && (
                        <>
                          {`${exercise.sets} sets × ${exercise.reps} reps`}
                        </>
                      )}
                      {exerciseType === 'cardio' && 'Cardio Exercise'}
                      {exerciseType === 'flexibility' && 'Flexibility Exercise'}
                      {isRunExercise && 'Running Exercise'}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 mr-2 p-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAlternativeDialog(exercise);
                            }}
                          >
                            <ArrowRightLeft className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>See alternative exercises</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {hasYoutubeLink && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 mr-2 p-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                openVideoDialog(exercise.exercise.youtube_link, exercise.exercise.name);
                              }}
                            >
                              <Youtube className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Watch demo video</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <div className="text-muted-foreground">
                      <ChevronRight className={`h-5 w-5 transition-transform ${exerciseState.expanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>
              </CardHeader>

              {exerciseState.expanded && (
                <CardContent className="pt-4 px-4 pb-2">
                  {(exerciseType === 'strength' || exerciseType === 'bodyweight') && (
                    <>
                      <div className="flex items-center mb-3 gap-1 justify-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Rest between sets: {formatRestTime(exercise.rest_seconds)}</span>
                      </div>
                      
                      <div className="text-center text-xs text-muted-foreground mb-3">
                        {personalRecord ? (
                          <span>PR Weight: {personalRecord.weight} lbs</span>
                        ) : (
                          <span>No PR Weight Set</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <div className="text-center text-xs font-medium text-muted-foreground">Set</div>
                        <div className="text-center text-xs font-medium text-muted-foreground">Reps</div>
                        <div className="text-center text-xs font-medium text-muted-foreground">Weight</div>
                        <div className="text-center text-xs font-medium text-muted-foreground">Done</div>
                      </div>
                      {exerciseState.sets?.map((set, index) => (
                        <div key={`${exercise.id}-set-${index}`} className="grid grid-cols-4 items-center mb-3 gap-2">
                          <div className="text-center text-sm">
                            {index + 1}
                          </div>
                          
                          <div>
                            <Input 
                              type="text"
                              inputMode="numeric"
                              placeholder="count"
                              value={set.reps}
                              onChange={(e) => handleSetChange(exercise.id, index, 'reps', e.target.value)}
                              className="h-9"
                            />
                          </div>
                          
                          <div>
                            <Input 
                              type="text"
                              inputMode="decimal"
                              placeholder="lbs"
                              value={set.weight}
                              onChange={(e) => handleSetChange(exercise.id, index, 'weight', e.target.value)}
                              className="h-9"
                            />
                          </div>
                          
                          <div className="flex justify-center">
                            <Checkbox 
                              id={`set-${exercise.id}-${index}-complete`}
                              checked={set.completed}
                              onCheckedChange={(checked) => handleSetCompletion(exercise.id, index, !!checked)}
                            />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {exerciseType === 'cardio' && exerciseState.cardioData && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs mb-1 block text-muted-foreground">Distance (optional)</label>
                        <Input 
                          type="text"
                          inputMode="decimal"
                          placeholder="miles, km, etc."
                          value={exerciseState.cardioData.distance}
                          onChange={(e) => handleCardioChange(exercise.id, 'distance', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block text-muted-foreground">Duration</label>
                        <Input 
                          type="text"
                          placeholder="mm:ss"
                          value={exerciseState.cardioData.duration}
                          onChange={(e) => handleCardioChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block text-muted-foreground">Location (optional)</label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="text"
                            placeholder="gym, park, etc."
                            value={exerciseState.cardioData.location}
                            onChange={(e) => handleCardioChange(exercise.id, 'location', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm">Mark as completed</span>
                        <Checkbox 
                          id={`cardio-${exercise.id}-complete`}
                          checked={exerciseState.cardioData.completed}
                          onCheckedChange={(checked) => handleCardioCompletion(exercise.id, !!checked)}
                        />
                      </div>
                    </div>
                  )}
                  
                  {exerciseType === 'flexibility' && exerciseState.flexibilityData && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs mb-1 block text-muted-foreground">Duration</label>
                        <Input 
                          type="text"
                          placeholder="mm:ss"
                          value={exerciseState.flexibilityData.duration}
                          onChange={(e) => handleFlexibilityChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm">Mark as completed</span>
                        <Checkbox 
                          id={`flexibility-${exercise.id}-complete`}
                          checked={exerciseState.flexibilityData.completed}
                          onCheckedChange={(checked) => handleFlexibilityCompletion(exercise.id, !!checked)}
                        />
                      </div>
                    </div>
                  )}
                  
                  {isRunExercise && exerciseState.runData && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs mb-1 block text-muted-foreground">Distance</label>
                        <Input 
                          type="text"
                          inputMode="decimal"
                          placeholder="miles, km, etc."
                          value={exerciseState.runData.distance}
                          onChange={(e) => handleRunChange(exercise.id, 'distance', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block text-muted-foreground">Duration</label>
                        <Input 
                          type="text"
                          placeholder="mm:ss"
                          value={exerciseState.runData.duration}
                          onChange={(e) => handleRunChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block text-muted-foreground">Location (optional)</label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="text"
                            placeholder="track, park, etc."
                            value={exerciseState.runData.location}
                            onChange={(e) => handleRunChange(exercise.id, 'location', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm">Mark as completed</span>
                        <Checkbox 
                          id={`run-${exercise.id}-complete`}
                          checked={exerciseState.runData.completed}
                          onCheckedChange={(checked) => handleRunCompletion(exercise.id, !!checked)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t shadow-md flex flex-col justify-center z-10 gap-3">
        {isStrengthWorkout && (
          <Stopwatch className="w-full mb-2" />
        )}
        <Button 
          onClick={finishWorkout}
          className="bg-client hover:bg-client/90 min-w-[200px]"
          disabled={saveAllSetsMutation.isPending}
        >
          {saveAllSetsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Workout
            </>
          )}
        </Button>
      </div>
      
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentExerciseName}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full overflow-hidden rounded-md">
            {currentVideoUrl && <VideoPlayer youtubeUrl={currentVideoUrl} />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={alternativeDialogOpen} onOpenChange={setAlternativeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alternative Exercises</DialogTitle>
            <DialogDescription>
              Choose an alternative exercise to replace {currentExercise?.exercise?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto">
            {alternativeExercises.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No alternative exercises available</p>
            ) : (
              alternativeExercises.map((alt) => (
                <Card 
                  key={alt.alternative_id} 
                  className="cursor-pointer hover:bg-accent/20 transition-colors"
                  onClick={() => handleAlternativeSelection(alt.alternative_id, alt.alternative_name)}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{alt.alternative_name}</CardTitle>
                    <CardDescription className="text-xs">
                      {alt.alternative_type.replace('_', ' ')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="secondary" 
              onClick={() => setAlternativeDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
