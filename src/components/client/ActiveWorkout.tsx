
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
import { useWorkoutState } from '@/hooks/useWorkoutState';
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

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [retryCount, setRetryCount] = useState(0);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  useEffect(() => {
    console.log("ActiveWorkout: Component mounted with workoutCompletionId:", workoutCompletionId);
    console.log("ActiveWorkout: Current user:", user?.id);
  }, [workoutCompletionId, user?.id]);

  // Attempt to fetch the workout with progressive retries
  const { data: workoutData, isLoading, error } = useQuery({
    queryKey: ['active-workout', workoutCompletionId, retryCount],
    queryFn: async () => {
      console.log(`Fetching workout data for ID: ${workoutCompletionId} (Attempt: ${retryCount + 1})`);
      
      try {
        // Try to find the workout completion directly by ID
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

        // If not found by ID, try by workout_id with the user's ID
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

        // As a last resort, try to fetch just the workout directly
        const { data: directWorkout, error: directWorkoutError } = await supabase
          .from('workouts')
          .select(`*, workout_exercises (*, exercise:exercise_id (*))`)
          .eq('id', workoutCompletionId || '')
          .maybeSingle();

        if (directWorkoutError) {
          console.error("Error fetching direct workout:", directWorkoutError);
        } else if (directWorkout) {
          console.log("Found direct workout:", directWorkout);
          
          // Create a synthetic workout completion
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

        // Check if it's a standalone workout
        const { data: standaloneWorkout, error: standaloneError } = await supabase
          .from('standalone_workouts')
          .select(`*, standalone_workout_exercises (*, exercise:exercise_id (*))`)
          .eq('id', workoutCompletionId || '')
          .maybeSingle();
          
        if (standaloneError) {
          console.error("Error fetching standalone workout:", standaloneError);
        } else if (standaloneWorkout) {
          console.log("Found standalone workout:", standaloneWorkout);
          
          // Create a synthetic workout completion for the standalone workout
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
        
        // If we've reached this point, log all the attempts made and throw a specific error
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
          // Retry a few times with a delay
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
    if (error) {
      console.error("Error in workout query:", error);
    }
  }, [error]);

  // Log the workout data to debug
  useEffect(() => {
    if (workoutData) {
      console.log("Workout data fetched:", workoutData);
      console.log("Workout exercises:", workoutData.workout?.workout_exercises);
    }
  }, [workoutData]);

  // Ensure we have an array of workout exercises, even if the structure varies
  const getWorkoutExercises = () => {
    if (!workoutData || !workoutData.workout) return [];
    
    // Check if the exercises are in workout_exercises (standard case)
    if (Array.isArray(workoutData.workout.workout_exercises)) {
      return workoutData.workout.workout_exercises;
    }
    
    // Check if the exercises are in standalone_workout_exercises (standalone workout case)
    if (workoutData.workout.standalone_workout_exercises && 
        Array.isArray(workoutData.workout.standalone_workout_exercises)) {
      return workoutData.workout.standalone_workout_exercises;
    }
    
    // If we still don't have exercises, look for them directly in the workout
    if (workoutData.standalone_workout_id && workoutData.workout) {
      if (Array.isArray(workoutData.workout.workout_exercises)) {
        return workoutData.workout.workout_exercises;
      }
    }
    
    // Return empty array if we couldn't find exercises
    console.error("No workout exercises found in workoutData:", workoutData);
    return [];
  };

  const workoutExercises = getWorkoutExercises();
  console.log("Workout exercises to render:", workoutExercises);

  const { exerciseStates, setExerciseStates, sortedExerciseIds } = useWorkoutState(workoutExercises);

  const toggleDescriptionExpanded = (exerciseId: string) => {
    setExpandedDescriptions(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const handleCompleteWorkout = () => {
    setIsCompletionDialogOpen(true);
  };

  const confirmCompleteWorkout = () => {
    // Mark workout as completed
    navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
  };

  // Helper function to format duration input as HH:MM:SS
  const formatDurationInput = (value: string): string => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue.length <= 2) {
      return numericValue;
    } else if (numericValue.length <= 4) {
      return `${numericValue.slice(0, 2)}:${numericValue.slice(2)}`;
    } else {
      return `${numericValue.slice(0, 2)}:${numericValue.slice(2, 4)}:${numericValue.slice(4, 6)}`;
    }
  };

  // Handler functions for exercise components
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
    // Open video in a new tab or modal
    window.open(url, '_blank');
  };

  const handleSwapExercise = (exercise: WorkoutExercise) => {
    // This would open a modal to swap the exercise
    toast.info("Exercise swap feature coming soon");
  };

  const renderExerciseCard = (exercise: WorkoutExercise) => {
    if (!exerciseStates[exercise.id]) {
      console.log(`No exercise state found for exercise with ID: ${exercise.id}`);
      return null;
    }
    
    const { expanded } = exerciseStates[exercise.id];
    const exerciseName = exercise.exercise?.name || '';
    const exerciseType = exercise.exercise?.exercise_type || 'strength';
    const description = exercise.exercise?.description || '';

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
                exercise={exercise}
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

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-40">
      <div className="flex items-center mb-4 gap-2">
        <Button variant="ghost" onClick={() => navigate('/client-dashboard/workouts')} className="h-8 w-8 p-0 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{workoutData.workout?.title || "Workout"}</h1>
      </div>

      <Stopwatch className="mt-2 mb-6" />

      {workoutExercises.length > 0 ? (
        <div className="space-y-6 mb-32">
          {console.log("Rendering workout exercises:", workoutExercises)}
          {console.log("Sorted exercise IDs:", sortedExerciseIds)}
          {workoutExercises.map(exercise => renderExerciseCard(exercise))}
          
          <div className="fixed bottom-24 left-0 right-0 bg-gradient-to-t from-background to-transparent pt-6 pb-4 px-4">
            <Button 
              onClick={handleCompleteWorkout}
              className="w-full py-6 bg-primary hover:bg-primary/90 text-white font-semibold text-lg rounded-lg shadow-lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" /> Complete Workout
            </Button>
          </div>
        </div>
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

      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Workout</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this workout as complete?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCompletionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCompleteWorkout}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkout;
