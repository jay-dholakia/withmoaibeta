import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackWorkoutSet, fetchPersonalRecords } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, MapPin, Save, HelpCircle, Info, Youtube, Clock, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { saveWorkoutDraft, getWorkoutDraft, deleteWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { useWorkoutState, AutosaveStatus } from '@/hooks/useWorkoutState';
import { PersonalRecord, Exercise, WorkoutExercise } from '@/types/workout';
import { VideoPlayer } from '@/components/client/VideoPlayer';
import Stopwatch from './Stopwatch';
import { cn } from '@/lib/utils';
import { fetchSimilarExercises } from '@/services/exercise-service';
import { StrengthExercise } from './workout/StrengthExercise';
import { CardioExercise } from './workout/CardioExercise';
import { FlexibilityExercise } from './workout/FlexibilityExercise';
import { RunExercise } from './workout/RunExercise';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [authStateChanged, setAuthStateChanged] = useState(0);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});
  const [draftLoadAttempted, setDraftLoadAttempted] = useState(false);
  
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentExerciseName, setCurrentExerciseName] = useState<string>('');

  const [alternativeDialogOpen, setAlternativeDialogOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [alternativeExercises, setAlternativeExercises] = useState<any[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);

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

  const {
    exerciseStates,
    setExerciseStates,
    pendingSets,
    setPendingSets,
    pendingCardio,
    setPendingCardio,
    pendingFlexibility,
    setPendingFlexibility,
    pendingRuns,
    setPendingRuns,
    workoutDataInitialized
  } = useWorkoutState(workoutData?.workout?.workout_exercises as WorkoutExercise[] | undefined);

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
      try {
        // Save to sessionStorage first for immediate access on page reload
        try {
          sessionStorage.setItem(`workout_draft_${workoutCompletionId}`, JSON.stringify({
            draft_data: data,
            workout_type: 'workout',
            updated_at: new Date().toISOString()
          }));
        } catch (e) {
          console.warn("Failed to save draft to sessionStorage:", e);
        }
        
        const result = await saveWorkoutDraft(
          workoutCompletionId, 
          'workout', 
          data
        );
        
        return result;
      } catch (error) {
        console.error("Error saving workout draft:", error);
        return false;
      }
    },
    interval: 3000,
    debounce: 1000,
    disabled: !workoutCompletionId || !user?.id || !workoutDataInitialized
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
    const loadDraftData = async () => {
      if (!workoutCompletionId || !user?.id || !workoutDataInitialized || draftLoadAttempted || draftLoaded) {
        return;
      }
      
      console.log("Attempting to load draft data for workout:", workoutCompletionId);
      setDraftLoadAttempted(true);
      
      try {
        // First try to get draft from sessionStorage for faster loading
        let draft = null;
        try {
          const cachedDraft = sessionStorage.getItem(`workout_draft_${workoutCompletionId}`);
          if (cachedDraft) {
            draft = JSON.parse(cachedDraft);
            console.log("Found draft in sessionStorage:", draft);
          }
        } catch (e) {
          console.warn("Failed to retrieve draft from sessionStorage:", e);
        }
        
        // If not in sessionStorage or doesn't exist, get from Supabase
        if (!draft || !draft.draft_data) {
          console.log("Fetching draft from database");
          draft = await getWorkoutDraft(workoutCompletionId);
        }
        
        if (!draft || !draft.draft_data) {
          console.log("No draft found for workout:", workoutCompletionId);
          setDraftLoaded(true);
          return;
        }
        
        console.log("Draft found:", draft);
        
        const draftData = draft.draft_data;
        
        // Update states with draft data
        if (draftData.exerciseStates && Object.keys(draftData.exerciseStates).length > 0) {
          console.log("Restoring exercise states from draft");
          setExerciseStates(prevState => ({
            ...prevState,
            ...draftData.exerciseStates
          }));
        }
        
        if (draftData.pendingSets && draftData.pendingSets.length > 0) {
          console.log("Restoring pending sets from draft:", draftData.pendingSets);
          setPendingSets(draftData.pendingSets);
        }
        
        if (draftData.pendingCardio && draftData.pendingCardio.length > 0) {
          console.log("Restoring pending cardio from draft");
          setPendingCardio(draftData.pendingCardio);
        }
        
        if (draftData.pendingFlexibility && draftData.pendingFlexibility.length > 0) {
          console.log("Restoring pending flexibility from draft");
          setPendingFlexibility(draftData.pendingFlexibility);
        }
        
        if (draftData.pendingRuns && draftData.pendingRuns.length > 0) {
          console.log("Restoring pending runs from draft");
          setPendingRuns(draftData.pendingRuns);
        }
        
        toast.success("Your workout progress has been restored");
        setDraftLoaded(true);
      } catch (error) {
        console.error("Error loading draft data:", error);
        setDraftLoaded(true);
      }
    };
    
    loadDraftData();
  }, [workoutCompletionId, user, workoutDataInitialized, draftLoadAttempted, draftLoaded, setExerciseStates, setPendingSets, setPendingCardio, setPendingFlexibility, setPendingRuns]);

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
      
      const originalState = updatedStates[originalExerciseId];
      if (!originalState) return prev;
      
      updatedStates[originalExerciseId] = {
        ...originalState,
        sets: originalState.sets.map(set => ({
          ...set,
          weight: '',
          reps: '',
          completed: false
        })),
        exerciseInfo: {
          ...originalState.exerciseInfo,
          exerciseId: newExercise.id,
          name: newExercise.name
        }
      };
      
      return updatedStates;
    });
    
    if (workoutData?.workout?.workout_exercises) {
      const exercises = workoutData.workout.workout_exercises;
      
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
    
    setPendingSets(prev => prev.filter(set => set.exerciseId !== originalExerciseId));
    
    closeAlternativeDialog();
    toast.success(`Swapped to ${newExercise.name}`);
  };

  const renderExerciseCard = (exercise: WorkoutExercise) => {
    const exerciseType = exercise.exercise?.exercise_type || 'strength';
    const exerciseName = exercise.exercise?.name || '';
    const isRunExercise = exerciseName.toLowerCase().includes('run') || exerciseName.toLowerCase().includes('running');
    const exerciseDescription = exercise.exercise?.description;
    const exerciseNotes = exercise.notes;
    const youtubeLink = exercise.exercise?.youtube_link;
    const personalRecord = getExercisePR(exercise.exercise?.id || '');

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

            {(exerciseType === 'strength' || exerciseType === 'bodyweight') && !isRunExercise && (
              <StrengthExercise
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                personalRecord={personalRecord}
                onSetChange={handleSetChange}
                onSetCompletion={handleSetCompletion}
                onVideoClick={openVideoDialog}
                onSwapClick={openAlternativeDialog}
              />
            )}

            {exerciseType === 'cardio' && !isRunExercise && (
              <CardioExercise
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                formatDurationInput={formatDurationInput}
                onCardioChange={handleCardioChange}
                onCardioCompletion={handleCardioCompletion}
                onVideoClick={openVideoDialog}
              />
            )}

            {exerciseType === 'flexibility' && (
              <FlexibilityExercise
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                formatDurationInput={formatDurationInput}
                onFlexibilityChange={handleFlexibilityChange}
                onFlexibilityCompletion={handleFlexibilityCompletion}
                onVideoClick={openVideoDialog}
              />
            )}

            {isRunExercise && (
              <RunExercise
                exercise={exercise}
                exerciseState={exerciseStates[exercise.id]}
                onRunChange={handleRunChange}
                onRunCompletion={handleRunCompletion}
                onVideoClick={openVideoDialog}
                formatDurationInput={formatDurationInput}
              />
            )}
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
        <p className="text-gray-500 text-center mb-6">Could not load the requested workout.</p>
        <Button onClick={() => navigate('/client-dashboard/workouts')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workouts
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-20">
      <div className="flex items-center mb-4 gap-2">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/client-dashboard/workouts')} 
          className="h-8 w-8 p-0 text-gray-500" 
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{workoutData.workout?.title || "Workout"}</h1>
      </div>
      
      {workoutData.workout?.description && (
        <p className="text-gray-500 mb-6">{workoutData.workout.description}</p>
      )}

      <Stopwatch className="mt-2 mb-6" />
    
      {workoutData.workout?.workout_exercises && Array.isArray(workoutData.workout.workout_exercises) && workoutData.workout.workout_exercises.length > 0 ? (
        <div className="space-y-6">
          {workoutData.workout.workout_exercises.map((exercise: any) => (
            renderExerciseCard(exercise)
          ))}
          
          <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t z-10">
            <Button
              className="w-full"
              size="lg"
              onClick={() => saveAllSetsMutation.mutate()}
              disabled={saveAllSetsMutation.isPending}
            >
              {saveAllSetsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Complete Workout
                </>
              )}
            </Button>
            <div className="flex justify-center mt-2">
              <p className="text-xs text-gray-500">
                {saveStatus === 'saved' && 'Progress autosaved'}
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'error' && 'Error saving'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No Exercises Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This workout doesn't have any exercises.
          </p>
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={closeVideoDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{currentExerciseName}</DialogTitle>
            <DialogDescription>
              Watch the exercise demonstration video
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video overflow-hidden rounded-md">
            {currentVideoUrl && <VideoPlayer url={currentVideoUrl} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alternative Exercise Dialog */}
      <Dialog open={alternativeDialogOpen} onOpenChange={closeAlternativeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alternative Exercises</DialogTitle>
            <DialogDescription>
              Select an alternative exercise to swap with {currentExercise?.exercise?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto">
            {isLoadingAlternatives ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alternativeExercises.length > 0 ? (
              <div className="space-y-2">
                {alternativeExercises.map((exercise) => (
                  <div 
                    key={exercise.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleExerciseSwap(exercise, currentExercise?.id)}
                  >
                    <span>{exercise.name}</span>
                    <Button variant="outline" size="sm">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p>No alternative exercises found.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeAlternativeDialog}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
