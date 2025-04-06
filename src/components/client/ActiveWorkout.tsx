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
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, MapPin, Save, HelpCircle, Info, Youtube } from 'lucide-react';
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
} from "@/components/ui/dialog";
import { VideoPlayer } from '@/components/client/VideoPlayer';

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

  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});
  
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentExerciseName, setCurrentExerciseName] = useState<string>('');

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
      return await saveWorkoutDraft(
        workoutCompletionId || null,
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
    const loadDraftData = async () => {
      if (!workoutCompletionId || draftLoaded) return;
      
      try {
        console.log("Attempting to load draft data for workout:", workoutCompletionId);
        
        const draft = await getWorkoutDraft(workoutCompletionId, 7, 500);
        
        if (!mounted) return;
        
        if (draft && draft.draft_data) {
          console.log("Draft data found, processing...");
          
          const draftData = draft.draft_data;
          
          if (draftData.exerciseStates && Object.keys(draftData.exerciseStates).length > 0) {
            console.log(`Loading ${Object.keys(draftData.exerciseStates).length} exercise states from draft`);
            setExerciseStates(prevStates => ({
              ...prevStates,
              ...draftData.exerciseStates
            }));
          }
          
          if (draftData.pendingSets && draftData.pendingSets.length > 0) {
            console.log(`Loading ${draftData.pendingSets.length} pending sets from draft`);
            setPendingSets(draftData.pendingSets);
          }
          
          if (draftData.pendingCardio && draftData.pendingCardio.length > 0) {
            console.log(`Loading ${draftData.pendingCardio.length} pending cardio from draft`);
            setPendingCardio(draftData.pendingCardio);
          }
          
          if (draftData.pendingFlexibility && draftData.pendingFlexibility.length > 0) {
            console.log(`Loading ${draftData.pendingFlexibility.length} pending flexibility from draft`);
            setPendingFlexibility(draftData.pendingFlexibility);
          }
          
          if (draftData.pendingRuns && draftData.pendingRuns.length > 0) {
            console.log(`Loading ${draftData.pendingRuns.length} pending runs from draft`);
            setPendingRuns(draftData.pendingRuns);
          }
          
          console.log("Draft data successfully loaded and applied to component state");
          toast.success('Workout progress restored');
        } else {
          console.log("No draft data found or draft data is empty");
        }
        
        setDraftLoaded(true);
      } catch (error) {
        console.error("Error loading workout draft:", error);
        setDraftLoaded(true);
      }
    };
    
    let mounted = true;
    let draftLoaded = false;
    
    if (user && workoutCompletionId && !draftLoaded) {
      console.log("User authenticated, loading draft data");
      loadDraftData();
    } else if (!user && workoutCompletionId && !draftLoaded) {
      console.log("User not authenticated yet, setting timeout for retry");
      const timer = setTimeout(() => {
        if (mounted && !draftLoaded) {
          console.log("Retrying draft load after timeout");
          loadDraftData();
        }
      }, 1500);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      mounted = false;
    };
  }, [workoutCompletionId, user, draftLoaded]);

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
    <div className="space-y-6 pb-28 flex flex-col items-center mx-auto px-4 w-full max-w-md">
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

          const hasDescription = exercise.exercise?.description && exercise.exercise.description.trim() !== '';
          const hasYoutubeLink = exercise.exercise?.youtube_link && exercise.exercise.youtube_link.trim() !== '';
          
          return (
            <Card key={exercise.id} className="overflow-hidden border-gray-200 w-full">
              <CardHeader 
                className="cursor-pointer bg-client/5 text-center relative" 
                onClick={() => toggleExerciseExpanded(exercise.id)}
              >
                <div className="absolute right-1 top-1 flex gap-1">
                  {hasYoutubeLink && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 p-0 text-red-500 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              openVideoDialog(exercise.exercise.youtube_link, exercise.exercise.name);
                            }}
                          >
                            <Youtube className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Watch video demonstration</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {hasDescription && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 p-0 text-muted-foreground z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDescriptionExpanded(exercise.id);
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">View exercise description</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                
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
                    {(expandedDescriptions[exercise.id] && exercise.exercise?.description) && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200 text-sm">
                        <p className="font-medium mb-1">Exercise Description:</p>
                        <p className="text-muted-foreground">{exercise.exercise.description}</p>
                      </div>
                    )}
                    
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
                        
                        <div className="flex justify-center pt-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`run-complete-${exercise.id}`}
                              checked={exerciseState.runData?.completed || false}
                              onCheckedChange={(checked) => 
                                handleRunCompletion(exercise.id, checked === true)
                              }
                            />
                            <label
                              htmlFor={`run-complete-${exercise.id}`}
                              className="cursor-pointer text-sm font-medium"
                            >
                              Mark as completed
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : exerciseType === 'strength' || exerciseType === 'bodyweight' ? (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-center px-2 mb-2">
                            <div className="w-16 text-sm font-medium text-center">
                              Set
                            </div>
                            <div className="flex-1 text-center text-sm font-medium">
                              Reps
                            </div>
                            <div className="flex-1 text-center text-sm font-medium">
                              Weight
                            </div>
                            <div className="w-10"></div>
                          </div>
                          
                          {exerciseState.sets.map((set, setIndex) => (
                            <div key={setIndex} className="flex items-center border p-2 rounded-md">
                              <div className="w-16 text-sm text-center">
                                Set {set.setNumber}
                              </div>
                              <div className="flex-1 text-center px-1">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="reps"
                                  value={set.reps}
                                  onChange={(e) => handleSetChange(exercise.id, setIndex, 'reps', e.target.value)}
                                  className="h-8 text-center min-w-0 px-1"
                                />
                              </div>
                              <div className="flex-1 text-center px-1">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="lbs"
                                  value={set.weight}
                                  onChange={(e) => handleSetChange(exercise.id, setIndex, 'weight', e.target.value)}
                                  className="h-8 text-center min-w-0 px-1"
                                />
                              </div>
                              <div className="w-10 flex justify-center items-center">
                                <Checkbox
                                  checked={set.completed}
                                  onCheckedChange={(checked) => handleSetCompletion(
                                    exercise.id,
                                    setIndex,
                                    checked === true
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : exerciseType === 'cardio' ? (
                      <>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          
                          <div className="flex justify-center pt-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`cardio-complete-${exercise.id}`}
                                checked={exerciseState.cardioData?.completed || false}
                                onCheckedChange={(checked) => 
                                  handleCardioCompletion(exercise.id, checked === true)
                                }
                              />
                              <label
                                htmlFor={`cardio-complete-${exercise.id}`}
                                className="cursor-pointer text-sm font-medium"
                              >
                                Mark as completed
                              </label>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : exerciseType === 'flexibility' ? (
                      <>
                        <div className="space-y-4">
                          <div className="text-center">
                            <label className="block text-sm font-medium mb-1 text-center">Duration (hh:mm:ss)</label>
                            <Input
                              placeholder="00:00:00"
                              value={exerciseState.flexibilityData?.duration || ''}
                              onChange={(e) => handleFlexibilityChange(
                                exercise.id, 
                                'duration', 
                                formatDurationInput(e.target.value)
                              )}
                              className="h-9 text-center mx-auto w-full max-w-xs border border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-center">Format: hours:minutes:seconds</p>
                          </div>
                          
                          <div className="flex justify-center pt-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`flex-complete-${exercise.id}`}
                                checked={exerciseState.flexibilityData?.completed || false}
                                onCheckedChange={(checked) => 
                                  handleFlexibilityCompletion(exercise.id, checked === true)
                                }
                              />
                              <label
                                htmlFor={`flex-complete-${exercise.id}`}
                                className="cursor-pointer text-sm font-medium"
                              >
                                Mark as completed
                              </label>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{currentExerciseName}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-0">
            {currentVideoUrl && (
              <VideoPlayer 
                youtubeUrl={currentVideoUrl} 
                className="aspect-video"
                controls={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {workoutExercises.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-center">
          <Button 
            onClick={finishWorkout}
            disabled={saveAllSetsMutation.isPending || !isWorkoutComplete()}
            className="w-full max-w-md bg-client hover:bg-client/90"
          >
            {saveAllSetsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Workout'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActiveWorkout;
