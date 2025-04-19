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

// Define the interface for the exercise state
interface ExerciseSet {
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseState {
  sets: ExerciseSet[];
}

interface PendingSet {
  exerciseId: string;
  setNumber: number;
  weight: string;
  reps: string;
}

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const stopwatchRef = useRef<HTMLDivElement>(null);

  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
  const [pendingSets, setPendingSets] = useState<PendingSet[]>([]);

  const { data: workoutCompletion, isLoading, isError } = useQuery({
    queryKey: ['workoutCompletion', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_completions')
        .select(`
          *,
          workout (
            *,
            workout_exercises (
              *,
              exercise (*)
            )
          )
        `)
        .eq('id', workoutCompletionId)
        .single();

      if (error) {
        console.error('Error fetching workout completion:', error);
        throw new Error('Failed to fetch workout completion');
      }

      return data;
    },
    enabled: !!workoutCompletionId,
  });

  const { data: personalRecords } = useQuery({
    queryKey: ['personalRecords', user?.id],
    queryFn: () => fetchPersonalRecords(user?.id),
    enabled: !!user?.id,
  });

  const workoutExercises = workoutCompletion?.workout?.workout_exercises || [];
  const currentExercise = workoutExercises[currentExerciseIndex];

  useEffect(() => {
    if (workoutCompletion) {
      const initialExerciseStates: Record<string, ExerciseState> = {};
      workoutExercises.forEach((exercise) => {
        const sets = Array(exercise.sets).fill({ weight: '', reps: '', completed: false });
        initialExerciseStates[exercise.exercise_id] = { sets };
      });
      setExerciseStates(initialExerciseStates);
    }
  }, [workoutCompletion, workoutExercises]);

  useEffect(() => {
    const draftKey = `workout-draft-${workoutCompletionId}`;

    const loadDraft = async () => {
      const draft = await getWorkoutDraft(draftKey);
      if (draft) {
        setExerciseStates(draft.exerciseStates);
        setPendingSets(draft.pendingSets);
        setCurrentExerciseIndex(draft.currentExerciseIndex);
      }
    };

    loadDraft();

    return () => {
      saveWorkoutDraft(draftKey, { exerciseStates, pendingSets, currentExerciseIndex });
    };
  }, [workoutCompletionId]);

  useAutosave({
    data: { exerciseStates, pendingSets, currentExerciseIndex },
    save: async (data) => {
      const draftKey = `workout-draft-${workoutCompletionId}`;
      await saveWorkoutDraft(draftKey, data);
    },
    enabled: !!workoutCompletionId,
    interval: 10000,
  });

  useEffect(() => {
    if (workoutCompletion && workoutExercises.length > 0) {
      const allSetsCompleted = workoutExercises.every((exercise) => {
        const exerciseState = exerciseStates[exercise.exercise_id];
        if (!exerciseState) return false;
        return exerciseState.sets.every((set) => set.completed);
      });
      setCompleted(allSetsCompleted);
    }
  }, [exerciseStates, workoutExercises, workoutCompletion]);

  const trackSet = useMutation(
    async (variables: { exerciseId: string; setNumber: number; weight: string; reps: string }) => {
      setIsTracking(true);
      try {
        await trackWorkoutSet({
          workout_completion_id: workoutCompletionId!,
          workout_exercise_id: currentExercise.id,
          set_number: variables.setNumber,
          weight: variables.weight,
          reps_completed: variables.reps,
          completed: true,
          user_id: user?.id!,
        });
        toast.success(`Set ${variables.setNumber} tracked successfully!`);
      } catch (error) {
        console.error('Error tracking workout set:', error);
        toast.error('Failed to track workout set.');
        throw error;
      } finally {
        setIsTracking(false);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['personalRecords', user?.id]);
      },
    }
  );

  const handleCompleteWorkout = async () => {
    setShowDialog(true);
  };

  const confirmCompleteWorkout = async (rating: number, notes: string) => {
    setShowDialog(false);
    try {
      const { error } = await supabase
        .from('workout_completions')
        .update({ rating, notes })
        .eq('id', workoutCompletionId);

      if (error) {
        console.error('Error updating workout completion:', error);
        toast.error('Failed to complete workout.');
      } else {
        toast.success('Workout completed successfully!');
        const draftKey = `workout-draft-${workoutCompletionId}`;
        await deleteWorkoutDraft(draftKey);
        navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
      }
    } catch (error) {
      console.error('Error completing workout:', error);
      toast.error('Failed to complete workout.');
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleSetChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseStates((prev) => {
      if (!prev[exerciseId]) {
        return prev;
      }

      const updatedSets = prev[exerciseId].sets.map((set, idx) => {
        if (idx === setIndex) {
          const updatedSet = { ...set, [field]: value };
          if (field === 'weight' && value.trim() !== '') {
            updatedSet.completed = true;
          }
          return updatedSet;
        }
        return set;
      });

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          sets: updatedSets,
        },
      };
    });

    if (field === 'weight' && value.trim() !== '') {
      const setNumber = setIndex + 1;
      setPendingSets(prev => {
        const currentSet = exerciseStates[exerciseId].sets[setIndex];
        const filtered = prev.filter(s => !(s.exerciseId === exerciseId && s.setNumber === setNumber));
        return [...filtered, {
          exerciseId,
          setNumber,
          weight: value,
          reps: currentSet.reps
        }];
      });
    }
  };

  const handleTrackSet = async (exerciseId: string, setIndex: number) => {
    const setNumber = setIndex + 1;
    const pendingSet = pendingSets.find(s => s.exerciseId === exerciseId && s.setNumber === setNumber);

    if (pendingSet) {
      try {
        await trackSet.mutateAsync({
          exerciseId: pendingSet.exerciseId,
          setNumber: pendingSet.setNumber,
          weight: pendingSet.weight,
          reps: pendingSet.reps,
        });
        setPendingSets(prev => prev.filter(s => !(s.exerciseId === exerciseId && s.setNumber === setNumber)));
      } catch (error) {
        console.error("Failed to track set:", error);
      }
    }
  };

  const handleOpenYoutube = (youtubeLink: string | undefined) => {
    if (youtubeLink) {
      const videoId = youtubeLink.split('v=')[1];
      if (videoId) {
        setYoutubeId(videoId);
      }
    }
  };

  const handleCloseYoutube = () => {
    setYoutubeId(null);
  };

  const toggleStopwatch = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const resetStopwatch = () => {
    setIsStopwatchRunning(false);
    setElapsedTime(0);
  };

  const handleTimeUpdate = (time: number) => {
    setElapsedTime(time);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading workout...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !workoutCompletion) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <AlertCircle className="mr-2 h-4 w-4" />
            Failed to load workout.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/client-dashboard/workouts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workouts
          </Button>
        </div>
        <CardTitle className="text-2xl font-bold">{workoutCompletion.workout?.title}</CardTitle>
        <CardDescription>{workoutCompletion.workout?.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {currentExercise ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{currentExercise.exercise?.name}</h2>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="outline" size="icon" onClick={() => handleOpenYoutube(currentExercise.exercise?.youtube_link)}>
                        <Youtube className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      View tutorial
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="outline" size="icon" onClick={toggleStopwatch}>
                        <Clock className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Start/stop timer
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {currentExercise.exercise?.description && (
              <p className="text-sm text-muted-foreground">{currentExercise.exercise.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>Set</div>
              <div>Reps</div>
              <div>Weight (lbs)</div>
              {exerciseStates[currentExercise.exercise_id]?.sets.map((set, index) => (
                <React.Fragment key={index}>
                  <div>{index + 1}</div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={set.reps}
                      onChange={(e) => handleSetChange(currentExercise.exercise_id, index, 'reps', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Weight"
                      value={set.weight}
                      onChange={(e) => handleSetChange(currentExercise.exercise_id, index, 'weight', e.target.value)}
                      onBlur={() => handleTrackSet(currentExercise.exercise_id, index)}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={handlePrevExercise}
                disabled={currentExerciseIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === workoutExercises.length - 1}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p>No exercises found for this workout.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleCompleteWorkout} disabled={!completed}>
          Complete Workout
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={resetStopwatch}>
            Reset
          </Button>
          <Stopwatch isRunning={isStopwatchRunning} onTimeUpdate={handleTimeUpdate} ref={stopwatchRef} />
        </div>
      </CardFooter>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Workout</DialogTitle>
            <DialogDescription>
              How would you rate this workout?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                Rating
              </Label>
              <Input id="rating" defaultValue="5" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={youtubeId !== null} onOpenChange={() => setYoutubeId(null)}>
        <DialogContent className="sm:max-w-[80vw]">
          <DialogHeader>
            <DialogTitle>Exercise Tutorial</DialogTitle>
            <DialogDescription>
              Watch this video to learn how to properly perform the exercise.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {youtubeId && <VideoPlayer videoId={youtubeId} />}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCloseYoutube}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ActiveWorkout;

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
