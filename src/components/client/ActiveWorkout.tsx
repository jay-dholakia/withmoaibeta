
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
import { useIsMobile } from '@/lib/hooks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExerciseState, ExerciseStates } from '@/types/active-workout';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // State for the workout and exercise data
  const [showExerciseHelp, setShowExerciseHelp] = useState<string | null>(null);
  const [similarExercisesOpen, setSimilarExercisesOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [similarExercises, setSimilarExercises] = useState<Exercise[]>([]);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [showVideoPlayer, setShowVideoPlayer] = useState<string | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);

  // Fetch workout completion data
  const { data: workoutCompletion, isLoading, error } = useQuery({
    queryKey: ['workout-completion', workoutCompletionId],
    queryFn: async () => {
      if (!workoutCompletionId) throw new Error('No workout completion ID provided');
      
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
          )
        `)
        .eq('id', workoutCompletionId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!workoutCompletionId && !!user,
  });

  // Set up workout state manager
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
  } = useWorkoutState(workoutCompletion?.workout?.workout_exercises || []);

  // Autosave workout progress
  const { saveStatus, forceSave } = useAutosave({
    data: {
      exerciseStates,
      pendingSets,
      pendingCardio,
      pendingFlexibility,
      pendingRuns
    },
    onSave: async (data) => {
      if (!workoutCompletionId) return false;
      
      setAutosaveStatus('saving');
      const success = await saveWorkoutDraft(
        workoutCompletionId,
        workoutCompletion?.workout_type || 'workout',
        data
      );
      
      setAutosaveStatus(success ? 'saved' : 'error');
      return success;
    },
    debounce: 1500
  });

  // Update autosave status when saveStatus changes
  useEffect(() => {
    setAutosaveStatus(saveStatus);
  }, [saveStatus]);

  // Trigger autosave manually
  const triggerAutosave = () => {
    forceSave();
  };

  // Fetch saved workout draft
  useEffect(() => {
    const fetchDraft = async () => {
      if (!workoutCompletionId || !workoutDataInitialized) return;
      
      try {
        const draftData = await getWorkoutDraft(workoutCompletionId);
        if (draftData && draftData.draft_data) {
          if (draftData.draft_data.exerciseStates) {
            setExerciseStates(draftData.draft_data.exerciseStates);
          }
          
          if (draftData.draft_data.pendingSets) {
            setPendingSets(draftData.draft_data.pendingSets);
          }
          
          if (draftData.draft_data.pendingCardio) {
            setPendingCardio(draftData.draft_data.pendingCardio);
          }
          
          if (draftData.draft_data.pendingFlexibility) {
            setPendingFlexibility(draftData.draft_data.pendingFlexibility);
          }
          
          if (draftData.draft_data.pendingRuns) {
            setPendingRuns(draftData.draft_data.pendingRuns);
          }
          
          toast.success('Loaded your saved workout progress');
        }
      } catch (err) {
        console.error('Error loading draft:', err);
        toast.error('Could not load your saved progress');
      }
    };
    
    fetchDraft();
  }, [workoutCompletionId, workoutDataInitialized, setExerciseStates, setPendingSets, setPendingCardio, setPendingFlexibility, setPendingRuns]);

  // Fetch personal records
  useEffect(() => {
    if (!user?.id || !workoutCompletion?.workout?.workout_exercises) return;
    
    const exerciseIds = workoutCompletion.workout.workout_exercises
      .map(we => we.exercise?.id)
      .filter(Boolean);
      
    fetchPersonalRecords(user.id, exerciseIds)
      .then(records => setPersonalRecords(records))
      .catch(err => console.error('Error fetching PRs:', err));
  }, [user?.id, workoutCompletion?.workout?.workout_exercises]);

  // Toggle exercise expanded state
  const toggleExerciseExpanded = (exerciseId: string) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        expanded: !prev[exerciseId]?.expanded
      }
    }));
    
    triggerAutosave();
  };

  // Update exercise set values
  const handleSetChange = (exerciseId: string, setNumber: number, field: 'weight' | 'reps', value: string) => {
    setExerciseStates(prev => {
      const updatedExerciseState = {
        ...prev[exerciseId],
        sets: prev[exerciseId]?.sets.map(set => 
          set.setNumber === setNumber ? { ...set, [field]: value } : set
        )
      };
      
      return { ...prev, [exerciseId]: updatedExerciseState };
    });
    
    // Add to pending sets
    const currentExerciseInfo = exerciseStates[exerciseId]?.exerciseInfo;
    if (currentExerciseInfo) {
      const pendingSet = pendingSets.find(ps => 
        ps.exerciseId === currentExerciseInfo.exerciseId && ps.setNumber === setNumber
      );
      
      if (pendingSet) {
        setPendingSets(pendingSets.map(ps => 
          ps.exerciseId === currentExerciseInfo.exerciseId && ps.setNumber === setNumber
            ? { ...ps, [field]: value }
            : ps
        ));
      } else {
        setPendingSets([
          ...pendingSets,
          {
            exerciseId: currentExerciseInfo.exerciseId,
            setNumber: setNumber,
            weight: field === 'weight' ? value : exerciseStates[exerciseId]?.sets[setNumber - 1]?.weight || '',
            reps: field === 'reps' ? value : exerciseStates[exerciseId]?.sets[setNumber - 1]?.reps || ''
          }
        ]);
      }
    }
    
    triggerAutosave();
  };

  // Complete or uncomplete a set
  const toggleSetCompleted = (exerciseId: string, setNumber: number) => {
    setExerciseStates(prev => {
      const updatedSets = prev[exerciseId]?.sets.map(set => 
        set.setNumber === setNumber ? { ...set, completed: !set.completed } : set
      );
      
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          sets: updatedSets || []
        }
      };
    });
    
    triggerAutosave();
  };

  // Update cardio exercise data
  const handleCardioChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates(prev => {
      const updatedCardioData = {
        ...prev[exerciseId]?.cardioData,
        [field]: value
      };
      
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          cardioData: {
            ...updatedCardioData,
            completed: prev[exerciseId]?.cardioData?.completed || false
          }
        }
      };
    });
    
    // Update pending cardio data
    const currentExerciseInfo = exerciseStates[exerciseId]?.exerciseInfo;
    if (currentExerciseInfo) {
      const pendingCardioEntry = pendingCardio.find(pc => 
        pc.exerciseId === currentExerciseInfo.exerciseId
      );
      
      if (pendingCardioEntry) {
        setPendingCardio(pendingCardio.map(pc => 
          pc.exerciseId === currentExerciseInfo.exerciseId
            ? { ...pc, [field]: value }
            : pc
        ));
      } else {
        setPendingCardio([
          ...pendingCardio,
          {
            exerciseId: currentExerciseInfo.exerciseId,
            distance: field === 'distance' ? value : exerciseStates[exerciseId]?.cardioData?.distance || '',
            duration: field === 'duration' ? value : exerciseStates[exerciseId]?.cardioData?.duration || '',
            location: field === 'location' ? value : exerciseStates[exerciseId]?.cardioData?.location || ''
          }
        ]);
      }
    }
    
    triggerAutosave();
  };

  // Toggle cardio completion
  const toggleCardioCompleted = (exerciseId: string) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        cardioData: {
          ...prev[exerciseId]?.cardioData || {
            distance: '',
            duration: '',
            location: '',
            completed: false
          },
          completed: !(prev[exerciseId]?.cardioData?.completed)
        }
      }
    }));
    
    triggerAutosave();
  };

  // Update flexibility exercise data
  const handleFlexibilityChange = (exerciseId: string, value: string) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        flexibilityData: {
          ...prev[exerciseId]?.flexibilityData || {
            duration: '',
            completed: false
          },
          duration: value
        }
      }
    }));
    
    // Update pending flexibility data
    const currentExerciseInfo = exerciseStates[exerciseId]?.exerciseInfo;
    if (currentExerciseInfo) {
      const pendingFlexibilityEntry = pendingFlexibility.find(pf => 
        pf.exerciseId === currentExerciseInfo.exerciseId
      );
      
      if (pendingFlexibilityEntry) {
        setPendingFlexibility(pendingFlexibility.map(pf => 
          pf.exerciseId === currentExerciseInfo.exerciseId
            ? { ...pf, duration: value }
            : pf
        ));
      } else {
        setPendingFlexibility([
          ...pendingFlexibility,
          {
            exerciseId: currentExerciseInfo.exerciseId,
            duration: value
          }
        ]);
      }
    }
    
    triggerAutosave();
  };

  // Toggle flexibility completion
  const toggleFlexibilityCompleted = (exerciseId: string) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        flexibilityData: {
          ...prev[exerciseId]?.flexibilityData || {
            duration: '',
            completed: false
          },
          completed: !(prev[exerciseId]?.flexibilityData?.completed)
        }
      }
    }));
    
    triggerAutosave();
  };

  // Update running exercise data
  const handleRunChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates(prev => {
      const updatedRunData = {
        ...prev[exerciseId]?.runData,
        [field]: value
      };
      
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          runData: {
            ...updatedRunData,
            completed: prev[exerciseId]?.runData?.completed || false,
            distance: updatedRunData.distance || '',
            duration: updatedRunData.duration || '',
            location: updatedRunData.location || ''
          }
        }
      };
    });
    
    // Update pending run data
    const currentExerciseInfo = exerciseStates[exerciseId]?.exerciseInfo;
    if (currentExerciseInfo) {
      const pendingRunEntry = pendingRuns.find(pr => 
        pr.exerciseId === currentExerciseInfo.exerciseId
      );
      
      if (pendingRunEntry) {
        setPendingRuns(pendingRuns.map(pr => 
          pr.exerciseId === currentExerciseInfo.exerciseId
            ? { ...pr, [field]: value }
            : pr
        ));
      } else {
        setPendingRuns([
          ...pendingRuns,
          {
            exerciseId: currentExerciseInfo.exerciseId,
            distance: field === 'distance' ? value : exerciseStates[exerciseId]?.runData?.distance || '',
            duration: field === 'duration' ? value : exerciseStates[exerciseId]?.runData?.duration || '',
            location: field === 'location' ? value : exerciseStates[exerciseId]?.runData?.location || ''
          }
        ]);
      }
    }
    
    triggerAutosave();
  };

  // Toggle run completion
  const toggleRunCompleted = (exerciseId: string) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        runData: {
          ...prev[exerciseId]?.runData || {
            distance: '',
            duration: '',
            location: '',
            completed: false
          },
          completed: !(prev[exerciseId]?.runData?.completed)
        }
      }
    }));
    
    triggerAutosave();
  };

  // Open dialog to swap exercise
  const handleOpenSimilarExercises = async (exerciseId: string) => {
    const exerciseObj = workoutCompletion?.workout?.workout_exercises?.find(
      we => we.id === exerciseId
    )?.exercise;
    
    if (!exerciseObj) return;
    
    try {
      setSelectedExerciseId(exerciseId);
      const similarExercisesList = await fetchSimilarExercises(exerciseObj.id);
      setSimilarExercises(similarExercisesList);
      setSimilarExercisesOpen(true);
    } catch (error) {
      console.error('Error fetching similar exercises:', error);
      toast.error('Failed to load alternative exercises');
    }
  };

  // Handle exercise swap
  const handleExerciseSwap = (exerciseId: string, newExercise: Exercise) => {
    // Find the current workout_exercise to swap
    const currentWorkoutExercise = workoutCompletion?.workout?.workout_exercises?.find(
      we => we.id === exerciseId
    );
    
    if (!currentWorkoutExercise) return;
    
    // Update exercise state with the new exercise info
    setExerciseStates(prev => {
      const currentState = prev[exerciseId];
      
      // Create updated exerciseInfo with the new exercise details
      const updatedExerciseInfo = {
        exerciseId: newExercise.id,
        name: newExercise.name
      };
      
      return {
        ...prev,
        [exerciseId]: {
          ...currentState,
          exerciseInfo: updatedExerciseInfo,
          // Reset sets if present
          sets: currentState.sets?.map(set => ({
            ...set,
            weight: '',
            reps: '',
            completed: false
          }))
        }
      };
    });
    
    // Clear any pending sets for this exercise
    const currentExerciseInfo = exerciseStates[exerciseId]?.exerciseInfo;
    if (currentExerciseInfo) {
      setPendingSets(pendingSets.filter(ps => ps.exerciseId !== currentExerciseInfo.exerciseId));
    }
    
    // Close the dialog
    setSimilarExercisesOpen(false);
    toast.success(`Swapped to ${newExercise.name}`);
    triggerAutosave();
  };

  // Complete workout and navigate to summary page
  const handleCompleteWorkout = async () => {
    if (!workoutCompletionId || !user?.id) return;
    
    try {
      // Mark the workout as completed
      const { error } = await supabase
        .from('workout_completions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', workoutCompletionId);
        
      if (error) throw error;
      
      // Delete the draft since we've completed the workout
      await deleteWorkoutDraft(workoutCompletionId);
      
      // Clear queries and navigate to completion page
      queryClient.invalidateQueries();
      navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
    } catch (err) {
      console.error('Error completing workout:', err);
      toast.error('Failed to complete workout');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-client" />
        <p className="mt-4 text-lg">Loading your workout...</p>
      </div>
    );
  }

  // Error state
  if (error || !workoutCompletion) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="mt-4 text-lg">Could not load workout</p>
        <Button 
          className="mt-4" 
          onClick={() => navigate('/client-dashboard/workouts')}
        >
          Back to Workouts
        </Button>
      </div>
    );
  }

  // Extract workout details
  const { workout } = workoutCompletion;
  
  // Check if workout exercises exists and is an array
  if (!workout?.workout_exercises || !Array.isArray(workout?.workout_exercises)) {
    console.error('No workout exercises found or invalid format:', workout?.workout_exercises);
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="mt-4 text-lg">No exercises found for this workout</p>
        <Button 
          className="mt-4" 
          onClick={() => navigate('/client-dashboard/workouts')}
        >
          Back to Workouts
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/client-dashboard/workouts')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="flex items-center gap-2">
          {autosaveStatus === 'saving' && (
            <span className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="animate-spin h-3 w-3 mr-1" /> Saving...
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
            </span>
          )}
          {autosaveStatus === 'error' && (
            <span className="flex items-center text-sm text-destructive">
              <AlertCircle className="h-3 w-3 mr-1" /> Error saving
            </span>
          )}
        </div>
      </div>

      {/* Workout Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{workout?.title}</h1>
        {workout?.description && (
          <p className="text-muted-foreground mt-2">{workout.description}</p>
        )}
      </div>

      {/* Timer */}
      <Card className="mb-8">
        <CardContent className="pt-6 flex justify-center">
          <Stopwatch />
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-6">
        {workout.workout_exercises.map((workoutExercise) => {
          const exerciseType = workoutExercise.exercise?.exercise_type || 'strength';
          const exerciseName = workoutExercise.exercise?.name || '';
          const isRunExercise = exerciseName.toLowerCase().includes('run') || exerciseName.toLowerCase().includes('running');
          
          // Get personal record for this exercise if available
          const pr = personalRecords.find(
            record => record.exercise_id === workoutExercise.exercise?.id
          );

          return (
            <Card key={workoutExercise.id} className="overflow-hidden">
              <CardHeader 
                className={cn(
                  "cursor-pointer flex flex-row items-center justify-between p-4",
                  exerciseStates[workoutExercise.id]?.expanded ? "pb-2" : ""
                )}
                onClick={() => toggleExerciseExpanded(workoutExercise.id)}
              >
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {exerciseStates[workoutExercise.id]?.exerciseInfo?.name || workoutExercise.exercise?.name}
                    {workoutExercise.exercise?.youtube_link && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVideoPlayer(workoutExercise.exercise?.youtube_link || null);
                        }}
                      >
                        <Youtube className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </CardTitle>
                  
                  {pr && (
                    <CardDescription className="flex items-center">
                      <Info className="h-3 w-3 mr-1" /> PR: {pr.weight} lbs × {pr.reps || 1}
                    </CardDescription>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSimilarExercises(workoutExercise.id);
                    }}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExerciseHelp(workoutExercise.id);
                    }}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                  
                  <ChevronRight 
                    className={cn(
                      "transition-transform h-6 w-6",
                      exerciseStates[workoutExercise.id]?.expanded && "rotate-90"
                    )}
                  />
                </div>
              </CardHeader>
              
              {exerciseStates[workoutExercise.id]?.expanded && (
                <CardContent className="pt-2">
                  {isRunExercise ? (
                    <RunExercise 
                      workoutExerciseId={workoutExercise.id}
                      exerciseState={exerciseStates[workoutExercise.id]}
                      onValueChange={(field, value) => handleRunChange(workoutExercise.id, field, value)}
                      onToggleComplete={() => toggleRunCompleted(workoutExercise.id)}
                    />
                  ) : exerciseType === 'cardio' ? (
                    <CardioExercise 
                      workoutExerciseId={workoutExercise.id}
                      exerciseState={exerciseStates[workoutExercise.id]}
                      onValueChange={(field, value) => handleCardioChange(workoutExercise.id, field, value)}
                      onToggleComplete={() => toggleCardioCompleted(workoutExercise.id)}
                    />
                  ) : exerciseType === 'flexibility' ? (
                    <FlexibilityExercise 
                      workoutExerciseId={workoutExercise.id}
                      exerciseState={exerciseStates[workoutExercise.id]}
                      onValueChange={(value) => handleFlexibilityChange(workoutExercise.id, value)}
                      onToggleComplete={() => toggleFlexibilityCompleted(workoutExercise.id)}
                    />
                  ) : (
                    <StrengthExercise 
                      workoutExerciseId={workoutExercise.id}
                      exerciseState={exerciseStates[workoutExercise.id]}
                      onSetChange={(setNumber, field, value) => 
                        handleSetChange(workoutExercise.id, setNumber, field, value)
                      }
                      onToggleComplete={(setNumber) => 
                        toggleSetCompleted(workoutExercise.id, setNumber)
                      }
                      workoutExercise={workoutExercise}
                    />
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Complete Workout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="container max-w-4xl mx-auto">
          <Button 
            className="w-full bg-client hover:bg-client/90" 
            size="lg"
            onClick={handleCompleteWorkout}
          >
            Complete Workout
          </Button>
        </div>
      </div>

      {/* Exercise Help Dialog */}
      <Dialog open={!!showExerciseHelp} onOpenChange={() => setShowExerciseHelp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Guide</DialogTitle>
          </DialogHeader>
          {showExerciseHelp && (
            <div className="space-y-4 mt-4">
              <p className="text-sm">
                {workout?.workout_exercises?.find(we => we.id === showExerciseHelp)?.exercise?.description || 
                 "No description available for this exercise."}
              </p>
              {workout?.workout_exercises?.find(we => we.id === showExerciseHelp)?.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Coach Notes:</h3>
                    <p className="text-sm">{workout.workout_exercises.find(we => we.id === showExerciseHelp)?.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Similar Exercises Dialog */}
      <Dialog open={similarExercisesOpen} onOpenChange={setSimilarExercisesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Alternative Exercise</DialogTitle>
            <DialogDescription>
              Select an alternative exercise to replace the current one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {similarExercises.length > 0 ? (
              similarExercises.map(exercise => (
                <div 
                  key={exercise.id} 
                  className="p-3 border rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => selectedExerciseId && handleExerciseSwap(selectedExerciseId, exercise)}
                >
                  <h3 className="font-medium">{exercise.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {exercise.exercise_type} • {exercise.category || 'Uncategorized'}
                  </p>
                </div>
              ))
            ) : (
              <p>No alternative exercises available</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimilarExercisesOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog open={!!showVideoPlayer} onOpenChange={() => setShowVideoPlayer(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Exercise Demo</DialogTitle>
          </DialogHeader>
          <div className="mt-4 aspect-video">
            {showVideoPlayer && <VideoPlayer url={showVideoPlayer} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
