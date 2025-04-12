
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackWorkoutSet, fetchHighestPersonalRecords } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, MapPin, Save, HelpCircle, Info, Youtube, Clock, ArrowRightLeft, Trophy } from 'lucide-react';
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

// Function to complete a workout
const completeWorkout = async (workoutCompletionId: string) => {
  const { data, error } = await supabase
    .from('workout_completions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', workoutCompletionId)
    .select()
    .single();

  if (error) {
    console.error("Error completing workout:", error);
    throw error;
  }

  return data;
};

// Define interfaces for props
interface StopwatchProps {
  className?: string;
  isRunning?: boolean;
  onTick?: (time: number) => void;
}

const ActiveWorkout: React.FC = () => {
  // State variables
  const [workout, setWorkout] = useState<any>(null);
  const [workoutCompletion, setWorkoutCompletion] = useState<any>(null);
  const [exerciseCompletions, setExerciseCompletions] = useState<any[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [setCompletions, setSetCompletions] = useState<any[][]>([]);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [highestPersonalRecords, setHighestPersonalRecords] = useState<any[]>([]);

  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const autosaveIntervalRef = useRef<number | null>(null);

  // Fetch workout completion data
  const { data: workoutCompletionData, isLoading: isCompletionLoading, error: completionError } = useQuery({
    queryKey: ['workoutCompletion', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('id', workoutCompletionId || '')
        .single();

      if (error) {
        console.error("Error fetching workout completion:", error);
        throw error;
      }

      return data;
    },
    enabled: !!workoutCompletionId
  });

  // When workoutCompletionData is fetched successfully, update the state
  useEffect(() => {
    if (workoutCompletionData) {
      setWorkoutCompletion(workoutCompletionData);
    }
  }, [workoutCompletionData]);

  // Fetch workout data
  const { data: workoutData, isLoading: isWorkoutLoading, error: workoutError } = useQuery({
    queryKey: ['workout', workoutCompletion?.workout_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises (
            *,
            exercise (
              name,
              exercise_type,
              equipment,
              youtube_url
            )
          )
        `)
        .eq('id', workoutCompletion?.workout_id || '')
        .single();

      if (error) {
        console.error("Error fetching workout:", error);
        throw error;
      }

      return data;
    },
    enabled: !!workoutCompletion?.workout_id
  });

  // Fetch exercise completions
  const { data: exerciseCompletionData, isLoading: isExerciseCompletionsLoading, error: exerciseCompletionsError } = useQuery({
    queryKey: ['exerciseCompletions', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_exercise_completions')
        .select('*')
        .eq('workout_completion_id', workoutCompletionId || '')
        .order('exercise_order', { ascending: true });

      if (error) {
        console.error("Error fetching exercise completions:", error);
        throw error;
      }

      return data;
    },
    enabled: !!workoutCompletionId
  });

  useEffect(() => {
    if (exerciseCompletionData) {
      setExerciseCompletions(exerciseCompletionData || []);
    }
  }, [exerciseCompletionData]);

  useEffect(() => {
    if (workoutData) {
      setWorkout(workoutData);
    }
  }, [workoutData]);

  useEffect(() => {
    if (exerciseCompletionData && workoutData) {
      // Initialize set completions for each exercise
      const initialSetCompletions = exerciseCompletionData.map((exerciseCompletion: any) => {
        return Array(exerciseCompletion.target_sets).fill(null);
      });
      setSetCompletions(initialSetCompletions);
    }
  }, [exerciseCompletionData, workoutData]);

  useEffect(() => {
    const fetchInitialSetCompletions = async () => {
      if (exerciseCompletionData && exerciseCompletionData.length > 0) {
        const fetchedSetCompletions = await Promise.all(
          exerciseCompletionData.map(async (exerciseCompletion: any) => {
            const { data: setCompletionData, error } = await supabase
              .from('workout_set_completions')
              .select('*')
              .eq('workout_exercise_id', exerciseCompletion.id)
              .order('set_number', { ascending: true });

            if (error) {
              console.error("Error fetching set completions:", error);
              return Array(exerciseCompletion.target_sets).fill(null);
            }

            const filledSetCompletionData = Array(exerciseCompletion.target_sets).fill(null);
            setCompletionData?.forEach((setCompletion: any) => {
              filledSetCompletionData[setCompletion.set_number - 1] = setCompletion;
            });

            return filledSetCompletionData;
          })
        );

        setSetCompletions(fetchedSetCompletions);
      }
    };

    fetchInitialSetCompletions();
  }, [exerciseCompletionData]);

  useEffect(() => {
    if (workoutCompletionData?.notes) {
      setNotes(workoutCompletionData.notes);
    }
  }, [workoutCompletionData?.notes]);

  // Autosave functionality
  useAutosave({
    enabled: isDirty,
    data: {
      setCompletions,
      notes
    },
    onSave: async (data) => {
      if (workoutCompletionId) {
        try {
          // Save workout notes
          await supabase
            .from('workout_completions')
            .update({ notes: data.notes })
            .eq('id', workoutCompletionId);

          // Save set completions
          await Promise.all(
            exerciseCompletions.map(async (exerciseCompletion: any, exerciseIndex: number) => {
              const currentSetCompletions = data.setCompletions[exerciseIndex];

              if (currentSetCompletions) {
                await Promise.all(
                  currentSetCompletions.map(async (setCompletion: any, setIndex: number) => {
                    const setNumber = setIndex + 1;

                    if (setCompletion) {
                      // Update existing set completion
                      await supabase
                        .from('workout_set_completions')
                        .update({
                          weight: setCompletion.weight,
                          reps_completed: setCompletion.reps_completed,
                          notes: setCompletion.notes,
                          distance: setCompletion.distance,
                          duration: setCompletion.duration,
                          location: setCompletion.location,
                          completed: setCompletion.completed || false
                        })
                        .eq('id', setCompletion.id);
                    } else {
                      // Create new set completion
                      await trackWorkoutSet(
                        exerciseCompletion.id,
                        workoutCompletionId,
                        setNumber,
                        {
                          weight: null,
                          reps_completed: null,
                          notes: null,
                          distance: null,
                          duration: null,
                          location: null,
                          completed: false
                        }
                      );
                    }
                  })
                );
              }
            })
          );

          toast.success('Workout saved!');
          setIsDirty(false);
          queryClient.invalidateQueries({queryKey: ['exerciseCompletions', workoutCompletionId]});
          queryClient.invalidateQueries({queryKey: ['workoutCompletion', workoutCompletionId]});
          return true;
        } catch (error) {
          console.error("Error during autosave:", error);
          toast.error('Failed to save workout.');
          return false;
        }
      }
      return false;
    },
    saveInterval: 60000, // 60 seconds
  });

  useEffect(() => {
    const fetchPersonalRecords = async () => {
      if (user?.id) {
        try {
          const records = await fetchHighestPersonalRecords(user.id);
          setHighestPersonalRecords(records);
        } catch (error) {
          console.error("Error fetching personal records:", error);
        }
      }
    };

    fetchPersonalRecords();
  }, [user?.id]);

  // Handlers
  const handleInputChange = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    setIsDirty(true);
    setSetCompletions((prevSetCompletions) => {
      const newSetCompletions = [...prevSetCompletions];
      if (!newSetCompletions[exerciseIndex]) {
        newSetCompletions[exerciseIndex] = [];
      }
      const setCompletion = newSetCompletions[exerciseIndex][setIndex] || {};
      newSetCompletions[exerciseIndex][setIndex] = { ...setCompletion, [field]: value };
      return newSetCompletions;
    });
  };

  const handleSetComplete = async (exerciseIndex: number, setIndex: number, completed: boolean) => {
    setIsDirty(true);
    setSetCompletions((prevSetCompletions) => {
      const newSetCompletions = [...prevSetCompletions];
      if (!newSetCompletions[exerciseIndex]) {
        newSetCompletions[exerciseIndex] = [];
      }
      const setCompletion = newSetCompletions[exerciseIndex][setIndex] || {};
      newSetCompletions[exerciseIndex][setIndex] = { ...setCompletion, completed: completed };
      return newSetCompletions;
    });
  };

  const handleShowVideo = (url: string | null) => {
    setVideoUrl(url);
    setShowVideo(true);
  };

  const handleCloseVideo = () => {
    setShowVideo(false);
    setVideoUrl(null);
  };

  const handleCompleteWorkout = async () => {
    if (!workoutCompletionId) return;
    
    try {
      await completeWorkout(workoutCompletionId);
      toast.success('Workout completed!');
      setShowCompletionDialog(true);
      setIsWorkoutComplete(true);
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error("Error completing workout:", error);
      toast.error('Failed to complete workout.');
    }
  };

  const handleToggleStopwatch = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const handleStopwatchTick = (time: number) => {
    setStopwatchTime(time);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsDirty(true);
    setNotes(e.target.value);
  };

  const handleOpenNotesDialog = () => {
    setShowNotesDialog(true);
  };

  const handleCloseNotesDialog = () => {
    setShowNotesDialog(false);
  };

  const getPersonalRecord = (exerciseId: string) => {
    return highestPersonalRecords.find(record => record.exercise_id === exerciseId);
  };

  // Render
  if (isWorkoutLoading || isCompletionLoading || isExerciseCompletionsLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (workoutError || completionError || exerciseCompletionsError) {
    return <div>Error: Could not load workout details.</div>;
  }

  if (!workout || !workoutCompletion || !exerciseCompletions) {
    return <div>Workout not found.</div>;
  }

  const activeExerciseCompletion = exerciseCompletions[activeExerciseIndex];
  const activeExercise = workout.exercises.find((exercise: any) => exercise.id === activeExerciseCompletion?.workout_exercise_id)?.exercise;
  const currentSetCompletions = setCompletions[activeExerciseIndex] || Array(activeExerciseCompletion?.target_sets).fill(null);

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/client-dashboard/workouts')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{workout.title}</CardTitle>
          </div>
          <CardDescription>Complete the workout and track your progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Exercise Details */}
          {activeExercise && activeExerciseCompletion ? (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">{activeExercise.name}</h3>
              <p className="text-gray-500">{activeExercise.exercise_type} - {activeExercise.equipment}</p>
              
              {/* Personal Record */}
              {getPersonalRecord(activeExercise.id) && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-medium">Personal Record</span>
                  </div>
                  <p className="text-sm text-blue-500">
                    Weight: {getPersonalRecord(activeExercise.id)?.weight} lbs
                  </p>
                </div>
              )}

              {/* Video */}
              {activeExercise.youtube_url && (
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => handleShowVideo(activeExercise.youtube_url)}>
                  <Youtube className="h-4 w-4 mr-2" />
                  Watch Video
                </Button>
              )}

              {/* Set Details */}
              <div className="mt-4">
                <h4 className="text-lg font-medium mb-2">Sets</h4>
                {Array.from({ length: activeExerciseCompletion.target_sets }, (_, i) => i + 1).map((setNumber) => {
                  const setIndex = setNumber - 1;
                  const setCompletion = currentSetCompletions[setIndex];
                  return (
                    <Card key={setNumber} className="mb-2">
                      <CardContent className="grid grid-cols-4 gap-4">
                        <div>
                          <label htmlFor={`weight-${setNumber}`} className="block text-sm font-medium text-gray-700">Weight (lbs)</label>
                          <Input
                            type="number"
                            id={`weight-${setNumber}`}
                            className="mt-1"
                            placeholder="Weight"
                            value={setCompletion?.weight || ''}
                            onChange={(e) => handleInputChange(activeExerciseIndex, setIndex, 'weight', e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor={`reps-${setNumber}`} className="block text-sm font-medium text-gray-700">Reps</label>
                          <Input
                            type="number"
                            id={`reps-${setNumber}`}
                            className="mt-1"
                            placeholder="Reps"
                            value={setCompletion?.reps_completed || ''}
                            onChange={(e) => handleInputChange(activeExerciseIndex, setIndex, 'reps_completed', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                          <label htmlFor={`completed-${setNumber}`} className="block text-sm font-medium text-gray-700">Completed</label>
                          <Checkbox
                            id={`completed-${setNumber}`}
                            checked={setCompletion?.completed || false}
                            onCheckedChange={(checked) => handleSetComplete(activeExerciseIndex, setIndex, !!checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>No exercises found for this workout.</div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <Button
              variant="secondary"
              onClick={() => setActiveExerciseIndex(activeExerciseIndex - 1)}
              disabled={activeExerciseIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setActiveExerciseIndex(activeExerciseIndex + 1)}
              disabled={activeExerciseIndex === exerciseCompletions.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="outline" size="icon" onClick={handleOpenNotesDialog}>
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View workout notes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="outline" size="icon" onClick={handleToggleStopwatch}>
                    <Clock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isStopwatchRunning ? 'Pause Stopwatch' : 'Start Stopwatch'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Stopwatch className={undefined} isRunning={isStopwatchRunning} onTick={handleStopwatchTick} />
          </div>
          <Button onClick={handleCompleteWorkout} disabled={isWorkoutComplete}>
            {isWorkoutComplete ? (
              <>
                Completed <CheckCircle2 className="h-4 w-4 ml-2" />
              </>
            ) : (
              'Complete Workout'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Video Dialog */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exercise Video</DialogTitle>
            <DialogDescription>
              Watch this video to learn how to properly perform the exercise.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {videoUrl && <VideoPlayer youtubeUrl={videoUrl} />}
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCloseVideo}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Workout Notes</DialogTitle>
            <DialogDescription>
              Add any notes about this workout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <textarea
              className="w-full rounded-md border border-gray-200 shadow-sm focus:border-client focus:ring-client"
              rows={5}
              placeholder="Add your notes here..."
              value={notes}
              onChange={handleNotesChange}
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCloseNotesDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
