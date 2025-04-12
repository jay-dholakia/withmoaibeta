import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackWorkoutSet, completeWorkout, fetchPersonalRecords } from '@/services/client-service';
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
import { PersonalRecord } from '@/components/client/PersonalRecordsTable';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [authStateChanged, setAuthStateChanged] = useState(0);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
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

  const { data: userPersonalRecords } = useQuery({
    queryKey: ['personal-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await fetchPersonalRecords(user.id);
      } catch (error) {
        console.error('Error fetching personal records:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userPersonalRecords) {
      setPersonalRecords(userPersonalRecords);
    }
  }, [userPersonalRecords]);

  const getExercisePersonalRecord = (exerciseId: string): PersonalRecord | undefined => {
    return personalRecords.find(record => record.exercise_id === exerciseId);
  };

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
        workoutCompletionId, 
        'workout', 
        data
      );
    },
    interval: 3000
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
            if (draft.draft_data.exerciseStates && Object.keys(draft.draft_data.exerciseStates).length > 0) {
              console.log(`Loading ${Object.keys(draft.draft_data.exerciseStates).length} exercise states from draft`);
              setExerciseStates(prevStates => ({
                ...prevStates,
                ...draft.draft_data.exerciseStates
              }));
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
        
        setDraftLoaded(true);
      } catch (error) {
        console.error("Error loading workout draft:", error);
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
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['personal-records', user.id] });
      }
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
          distance: distance || '',
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

  const handleStopwatchTick = (time: number) => {
    setStopwatchTime(time);
  };

  const finishWorkout = async () => {
    try {
      await saveAllSetsMutation.mutateAsync();
    } catch (error) {
      console.error("Error saving workout data:", error);
    }
  };

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
              } else {
                const rangeMatch = exercise.reps.match(/^(\d+)-(\d+)$/);
                if (rangeMatch) {
                  defaultReps = rangeMatch[2]; // Use the higher end of the range
                }
              }
            }
            
            return {
              setNumber: i + 1,
              weight: existingSet?.weight?.toString() || '',
              reps: existingSet?.reps_completed?.toString() || defaultReps,
              completed: !!existingSet?.completed
            };
          });
          
          initialState[exercise.id] = {
            expanded: false,
            sets
          };
        } else if (exerciseType === 'cardio') {
          const existingSet = workoutData.workout_set_completions?.find(
            (set: any) => set.workout_exercise_id === exercise.id && set.set_number === 1
          );
          
          initialState[exercise.id] = {
            expanded: false,
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
            expanded: false,
            sets: [],
            flexibilityData: {
              duration: existingSet?.duration || '',
              completed: !!existingSet?.completed
            }
          };
        }
      });
      
      if (Object.keys(initialState).length > 0) {
        setExerciseStates((prev) => ({
          ...initialState,
          ...prev // Merge with any existing states (e.g., from draft)
        }));
      }
    }
  }, [workoutData]);

  const renderExerciseCard = (exercise: any) => {
    const exerciseType = exercise.exercise?.exercise_type || 'strength';
    const exerciseName = (exercise.exercise?.name || '').toLowerCase();
    const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
    
    const pr = exercise.exercise?.id ? getExercisePersonalRecord(exercise.exercise.id) : undefined;
    const prDisplay = pr ? `${pr.weight} lbs �� ${pr.reps} reps` : 'Unavailable (Your First Time!)';
    
    if (isRunExercise) {
      return renderRunExercise(exercise, prDisplay);
    } else if (exerciseType === 'cardio') {
      return renderCardioExercise(exercise, prDisplay);
    } else if (exerciseType === 'flexibility') {
      return renderFlexibilityExercise(exercise, prDisplay);
    } else {
      return renderStrengthExercise(exercise, prDisplay);
    }
  };
  
  const renderRunExercise = (exercise: any, prDisplay: string) => {
    if (!exerciseStates[exercise.id]?.runData) {
      return null;
    }
    
    const { runData } = exerciseStates[exercise.id];
    
    return (
      <Card key={exercise.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{exercise.exercise?.name}</CardTitle>
            <div className="flex space-x-2">
              {exercise.exercise?.youtube_link && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-8 w-8" 
                  onClick={() => openVideoDialog(exercise.exercise.youtube_link, exercise.exercise.name)}
                >
                  <Youtube className="h-5 w-5 text-red-500" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 w-8" 
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <ChevronRight className={`h-5 w-5 transition-transform ${exerciseStates[exercise.id]?.expanded ? 'rotate-90' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            {exercise.notes}
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-1">PR: {prDisplay}</p>
        </CardHeader>
        
        {exerciseStates[exercise.id]?.expanded && (
          <CardContent>
            <div className="space-y-3">
              <div>
                <label htmlFor={`run-distance-${exercise.id}`} className="text-sm font-medium">
                  Distance (miles)
                </label>
                <Input
                  id={`run-distance-${exercise.id}`}
                  type="text"
                  inputMode="decimal"
                  value={runData.distance}
                  onChange={(e) => handleRunChange(exercise.id, 'distance', e.target.value)}
                  placeholder="0.0"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor={`run-duration-${exercise.id}`} className="text-sm font-medium">
                  Duration (hh:mm:ss)
                </label>
                <Input
                  id={`run-duration-${exercise.id}`}
                  type="text"
                  value={runData.duration}
                  onChange={(e) => handleRunChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                  placeholder="00:00:00"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor={`run-location-${exercise.id}`} className="text-sm font-medium">
                  Location
                </label>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <Input
                    id={`run-location-${exercise.id}`}
                    type="text"
                    value={runData.location}
                    onChange={(e) => handleRunChange(exercise.id, 'location', e.target.value)}
                    placeholder="Outdoor, treadmill, etc."
                  />
                </div>
              </div>
              
              {exercise.exercise?.description && (
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-xs text-muted-foreground flex items-center" 
                    onClick={() => toggleDescriptionExpanded(exercise.id)}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {expandedDescriptions[exercise.id] ? 'Hide details' : 'Show details'}
                  </Button>
                  
                  {expandedDescriptions[exercise.id] && (
                    <div className="text-sm mt-2 text-muted-foreground">
                      {exercise.exercise.description}
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Checkbox
                      id={`complete-run-${exercise.id}`}
                      checked={runData.completed}
                      onCheckedChange={(checked) => handleRunCompletion(exercise.id, checked === true)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`complete-run-${exercise.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as completed
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };
  
  const renderCardioExercise = (exercise: any, prDisplay: string) => {
    if (!exerciseStates[exercise.id]?.cardioData) {
      return null;
    }
    
    const { cardioData } = exerciseStates[exercise.id];
    
    return (
      <Card key={exercise.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{exercise.exercise?.name}</CardTitle>
            <div className="flex space-x-2">
              {exercise.exercise?.youtube_link && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-8 w-8" 
                  onClick={() => openVideoDialog(exercise.exercise.youtube_link, exercise.exercise.name)}
                >
                  <Youtube className="h-5 w-5 text-red-500" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 w-8" 
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <ChevronRight className={`h-5 w-5 transition-transform ${exerciseStates[exercise.id]?.expanded ? 'rotate-90' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            {exercise.notes}
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-1">PR: {prDisplay}</p>
        </CardHeader>
        
        {exerciseStates[exercise.id]?.expanded && (
          <CardContent>
            <div className="space-y-3">
              <div>
                <label htmlFor={`cardio-duration-${exercise.id}`} className="text-sm font-medium">
                  Duration (mm:ss)
                </label>
                <Input
                  id={`cardio-duration-${exercise.id}`}
                  type="text"
                  value={cardioData.duration}
                  onChange={(e) => handleCardioChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                  placeholder="00:00"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor={`cardio-distance-${exercise.id}`} className="text-sm font-medium">
                  Distance (optional)
                </label>
                <Input
                  id={`cardio-distance-${exercise.id}`}
                  type="text"
                  inputMode="decimal"
                  value={cardioData.distance}
                  onChange={(e) => handleCardioChange(exercise.id, 'distance', e.target.value)}
                  placeholder="Miles, steps, etc."
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor={`cardio-location-${exercise.id}`} className="text-sm font-medium">
                  Location
                </label>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <Input
                    id={`cardio-location-${exercise.id}`}
                    type="text"
                    value={cardioData.location}
                    onChange={(e) => handleCardioChange(exercise.id, 'location', e.target.value)}
                    placeholder="Gym, outdoors, etc."
                  />
                </div>
              </div>
              
              {exercise.exercise?.description && (
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-xs text-muted-foreground flex items-center" 
                    onClick={() => toggleDescriptionExpanded(exercise.id)}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {expandedDescriptions[exercise.id] ? 'Hide details' : 'Show details'}
                  </Button>
                  
                  {expandedDescriptions[exercise.id] && (
                    <div className="text-sm mt-2 text-muted-foreground">
                      {exercise.exercise.description}
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Checkbox
                      id={`complete-cardio-${exercise.id}`}
                      checked={cardioData.completed}
                      onCheckedChange={(checked) => handleCardioCompletion(exercise.id, checked === true)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`complete-cardio-${exercise.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as completed
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };
  
  const renderFlexibilityExercise = (exercise: any, prDisplay: string) => {
    if (!exerciseStates[exercise.id]?.flexibilityData) {
      return null;
    }
    
    const { flexibilityData } = exerciseStates[exercise.id];
    
    return (
      <Card key={exercise.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{exercise.exercise?.name}</CardTitle>
            <div className="flex space-x-2">
              {exercise.exercise?.youtube_link && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-8 w-8" 
                  onClick={() => openVideoDialog(exercise.exercise.youtube_link, exercise.exercise.name)}
                >
                  <Youtube className="h-5 w-5 text-red-500" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 w-8" 
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <ChevronRight className={`h-5 w-5 transition-transform ${exerciseStates[exercise.id]?.expanded ? 'rotate-90' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            {exercise.notes}
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-1">PR: {prDisplay}</p>
        </CardHeader>
        
        {exerciseStates[exercise.id]?.expanded && (
          <CardContent>
            <div className="space-y-3">
              <div>
                <label htmlFor={`flexibility-duration-${exercise.id}`} className="text-sm font-medium">
                  Duration (mm:ss)
                </label>
                <Input
                  id={`flexibility-duration-${exercise.id}`}
                  type="text"
                  value={flexibilityData.duration}
                  onChange={(e) => handleFlexibilityChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
                  placeholder="00:00"
                  className="mt-1"
                />
              </div>
              
              {exercise.exercise?.description && (
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-xs text-muted-foreground flex items-center" 
                    onClick={() => toggleDescriptionExpanded(exercise.id)}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {expandedDescriptions[exercise.id] ? 'Hide details' : 'Show details'}
                  </Button>
                  
                  {expandedDescriptions[exercise.id] && (
                    <div className="text-sm mt-2 text-muted-foreground">
                      {exercise.exercise.description}
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Checkbox
                      id={`complete-flexibility-${exercise.id}`}
                      checked={flexibilityData.completed}
                      onCheckedChange={(checked) => handleFlexibilityCompletion(exercise.id, checked === true)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`complete-flexibility-${exercise.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as completed
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };
  
  const renderStrengthExercise = (exercise: any, prDisplay: string) => {
    if (!exerciseStates[exercise.id]?.sets) {
      return null;
    }
    
    const { sets } = exerciseStates[exercise.id];
    
    return (
      <Card key={exercise.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{exercise.exercise?.name}</CardTitle>
            <div className="flex space-x-2">
              {exercise.exercise?.youtube_link && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-8 w-8" 
                  onClick={() => openVideoDialog(exercise.exercise.youtube_link, exercise.exercise.name)}
                >
                  <Youtube className="h-5 w-5 text-red-500" />
                </Button>
              )}
              
              {exercise.exercise?.id && exercise.exercise?.alternative_exercise_1_id && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8"
                        onClick={() => openAlternativeDialog(exercise)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Alternative exercises</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-8 w-8" 
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <ChevronRight className={`h-5 w-5 transition-transform ${exerciseStates[exercise.id]?.expanded ? 'rotate-90' : ''}`} />
              </Button>
            </div>
          </div>
          
          <CardDescription className="flex items-center">
            <span className="mr-4">{exercise.sets} sets × {exercise.reps} {exercise.reps === '1' ? 'rep' : 'reps'}</span>
            {exercise.rest_seconds && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1 inline" /> Rest: {formatRestTime(exercise.rest_seconds)}
              </span>
            )}
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-1">PR: {prDisplay}</p>
        </CardHeader>
        
        {exerciseStates[exercise.id]?.expanded && (
          <CardContent className="pt-2">
            <div className="space-y-4">
              {sets.map((set, setIndex) => (
                <div key={setIndex} className="border rounded-md p-3">
                  <div className="text-sm font-medium mb-2">Set {set.setNumber}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`weight-${exercise.id}-${setIndex}`} className="text-xs font-medium">
                        Weight (lbs)
                      </label>
                      <Input
                        id={`weight-${exercise.id}-${setIndex}`}
                        type="text"
                        inputMode="decimal"
                        value={set.weight}
                        onChange={(e) => handleSetChange(exercise.id, setIndex, 'weight', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label htmlFor={`reps-${exercise.id}-${setIndex}`} className="text-xs font-medium">
                        Reps
                      </label>
                      <Input
                        id={`reps-${exercise.id}-${setIndex}`}
                        type="text"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(e) => handleSetChange(exercise.id, setIndex, 'reps', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center">
                      <Checkbox
                        id={`complete-set-${exercise.id}-${setIndex}`}
                        checked={set.completed}
                        onCheckedChange={(checked) => handleSetCompletion(exercise.id, setIndex, checked === true)}
                        className="mr-2"
                      />
                      <label
                        htmlFor={`complete-set-${exercise.id}-${setIndex}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Mark as completed
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              
              {exercise.notes && (
                <div className="text-sm text-muted-foreground px-1 pt-1">
                  <span className="font-medium text-foreground">Note: </span>
                  {exercise.notes}
                </div>
              )}
              
              {exercise.exercise?.description && (
                <div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-xs text-muted-foreground flex items-center" 
                    onClick={() => toggleDescriptionExpanded(exercise.id)}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {expandedDescriptions[exercise.id] ? 'Hide details' : 'Show details'}
                  </Button>
                  
                  {expandedDescriptions[exercise.id] && (
                    <div className="text-sm mt-2 text-muted-foreground">
                      {exercise.exercise.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4 sm:px-6">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!workoutData) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Workout not found</h2>
          <p className="text-center text-gray-600 mb-4">
            The workout you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate('/client-dashboard/workouts')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  const workoutExercises = workoutData.workout?.workout_exercises || [];

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-5">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> 
          Back
        </Button>
        
        <div className="flex items-center">
          {saveStatus === 'saving' && (
            <span className="text-xs text-muted-foreground mr-2 flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Saving...
            </span>
          )}
          {saveStatus === 'success' && (
            <span className="text-xs text-green-600 mr-2 flex items-center">
              <Save className="h-3 w-3 mr-1" />
              Saved
            </span>
          )}
          <Stopwatch 
            className="ml-2" 
            onTick={handleStopwatchTick}
            isRunning={isRunning}
          />
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-1">
        {workoutData.workout?.title || 'Workout'}
      </h1>
      
      {workoutData.workout?.description && (
        <p className="text-gray-600 mb-6">{workoutData.workout.description}</p>
      )}

      <div className="mb-8">
        {Array.isArray(workoutExercises) && workoutExercises.length > 0 ? (
          workoutExercises
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map(exercise => renderExerciseCard(exercise))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No exercises found for this workout</p>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-12">
        <Button 
          size="lg" 
          disabled={saveAllSetsMutation.isPending}
          onClick={finishWorkout}
          className="w-full max-w-xs"
        >
          {saveAllSetsMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Finish Workout
            </>
          )}
        </Button>
      </div>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentExerciseName}</DialogTitle>
            <DialogDescription>Exercise Demonstration</DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full">
            <VideoPlayer videoUrl={currentVideoUrl || ''} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={alternativeDialogOpen} onOpenChange={setAlternativeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alternative Exercises</DialogTitle>
            <DialogDescription>Choose an alternative for {currentExercise?.exercise?.name}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 my-3">
            {alternativeExercises.map(alt => (
              <Button
                key={alt.alternative_id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleAlternativeSelection(alt.alternative_id, alt.alternative_name)}
              >
                <div>
                  <div className="font-medium">{alt.alternative_name}</div>
                  <div className="text-xs text-muted-foreground">{alt.alternative_type.replace(/_/g, ' ')}</div>
                </div>
              </Button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAlternativeDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
