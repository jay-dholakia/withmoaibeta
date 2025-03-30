
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Clock, BarChart, Check, SkipForward, Play, Flag, Timer, Ruler, Dumbbell } from 'lucide-react';
import { useStopwatch } from 'react-timer-hook';
import { toast } from 'sonner';
import {
  fetchWorkoutCompletion,
  fetchWorkoutCompletionExercises,
  updateWorkoutCompletionExercise,
  completeWorkoutCompletion,
  skipWorkoutCompletion,
  WorkoutCompletion,
  WorkoutCompletionExercise
} from '@/services/workout-completion-service';
import { fetchSupersetGroups } from '@/services/workout/superset-service';
import { SupersetGroup } from '@/types/workout';
import { formatTime } from '@/lib/utils';

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const navigate = useNavigate();

  const [workoutCompletion, setWorkoutCompletion] = useState<WorkoutCompletion | null>(null);
  const [exercises, setExercises] = useState<WorkoutCompletionExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [exerciseData, setExerciseData] = useState<any>({});
  const [isLogging, setIsLogging] = useState(false);
  const [supersetGroups, setSupersetGroups] = useState<SupersetGroup[]>([]);
  const [currentSuperset, setCurrentSuperset] = useState<string | null>(null);

  const {
    seconds,
    minutes,
    hours,
    isRunning,
    start,
    pause,
    reset,
  } = useStopwatch({ autoStart: false });

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutCompletionId) return;

      try {
        setIsLoading(true);

        const completion = await fetchWorkoutCompletion(workoutCompletionId);
        setWorkoutCompletion(completion);

        const exercisesData = await fetchWorkoutCompletionExercises(workoutCompletionId);
        setExercises(exercisesData);

        // If workout_id exists, fetch superset groups
        if (completion.workout_id) {
          try {
            const supersets = await fetchSupersetGroups(completion.workout_id);
            setSupersetGroups(supersets);
          } catch (error) {
            console.error('Error loading superset groups:', error);
            // Non-critical error, continue without supersets
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading workout details:', error);
        toast.error('Failed to load workout details');
        navigate('/client-dashboard/workouts');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkoutDetails();
  }, [workoutCompletionId, navigate]);

  // Group exercises by superset_group_id
  const groupedExercises = React.useMemo(() => {
    const groups: Record<string, WorkoutCompletionExercise[]> = {};
    
    // Add non-superset exercises with unique keys
    exercises.filter(ex => !ex.superset_group_id).forEach(ex => {
      groups[`single-${ex.id}`] = [ex];
    });
    
    // Group superset exercises
    exercises.filter(ex => ex.superset_group_id).forEach(ex => {
      if (!groups[ex.superset_group_id!]) {
        groups[ex.superset_group_id!] = [];
      }
      groups[ex.superset_group_id!].push(ex);
    });
    
    // Sort superset exercises by superset_order
    Object.keys(groups).forEach(key => {
      if (key.startsWith('single-')) return;
      groups[key].sort((a, b) => (a.superset_order || 0) - (b.superset_order || 0));
    });
    
    return groups;
  }, [exercises]);

  // Create a flat list of group keys for navigation
  const groupKeys = React.useMemo(() => {
    return Object.keys(groupedExercises);
  }, [groupedExercises]);

  const currentExerciseGroup = groupKeys[currentExerciseIndex] || null;
  const currentExercises = currentExerciseGroup ? groupedExercises[currentExerciseGroup] : [];
  const isSuperset = currentExerciseGroup && !currentExerciseGroup.startsWith('single-');

  const handleExerciseDataChange = (exerciseId: string, field: string, value: any) => {
    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || {}),
        [field]: value
      }
    }));
  };

  const handleAddExerciseResult = async (exerciseId: string) => {
    if (!workoutCompletionId || !exerciseData[exerciseId]) return;

    try {
      setIsLogging(true);

      const updatedExercise = await updateWorkoutCompletionExercise(exerciseId, {
        result: exerciseData[exerciseId],
        completed: true
      });

      const updatedExercises = exercises.map(ex =>
        ex.id === exerciseId ? updatedExercise : ex
      );
      setExercises(updatedExercises);

      // Clear just this exercise's data
      setExerciseData(prev => {
        const newData = {...prev};
        delete newData[exerciseId];
        return newData;
      });

      toast.success('Exercise logged successfully');
    } catch (error) {
      console.error('Error logging exercise:', error);
      toast.error('Failed to log exercise');
    } finally {
      setIsLogging(false);
    }
  };

  const allExercisesInGroupCompleted = () => {
    if (!currentExercises.length) return false;
    return currentExercises.every(ex => ex.completed);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < groupKeys.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workoutCompletionId) return;

    try {
      setIsCompleting(true);
      await completeWorkoutCompletion(workoutCompletionId);
      toast.success('Workout completed successfully');
      navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
    } catch (error) {
      console.error('Error completing workout:', error);
      toast.error('Failed to complete workout');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkipWorkout = async () => {
    if (!workoutCompletionId) return;

    try {
      setIsSkipping(true);
      await skipWorkoutCompletion(workoutCompletionId);
      toast.success('Workout skipped successfully');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error skipping workout:', error);
      toast.error('Failed to skip workout');
    } finally {
      setIsSkipping(false);
    }
  };

  const getSupersetTitle = (supersetId: string) => {
    const superset = supersetGroups.find(sg => sg.id === supersetId);
    return superset?.title || 'Superset';
  };

  const renderExerciseForm = (exercise: WorkoutCompletionExercise) => {
    const data = exerciseData[exercise.id] || {};

    if (!exercise.exercise) {
      return <div>Exercise information not available</div>;
    }

    switch (exercise.exercise.log_type) {
      case 'weight_reps':
        return (
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <BarChart className="h-4 w-4 mr-1 text-muted-foreground" />
                  <Label>Reps</Label>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={data.reps || ''}
                  onChange={(e) => handleExerciseDataChange(exercise.id, 'reps', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <BarChart className="h-4 w-4 mr-1 text-muted-foreground" />
                  <Label>Sets</Label>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={data.sets || ''}
                  onChange={(e) => handleExerciseDataChange(exercise.id, 'sets', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            {!isSuperset && (
              <div>
                <Button
                  type="button"
                  onClick={() => handleAddExerciseResult(exercise.id)}
                  disabled={!data.reps || !data.sets || isLogging}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Log Exercise
                </Button>
              </div>
            )}
          </div>
        );

      case 'duration':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center text-4xl font-bold">
              <Timer className="h-6 w-6 mr-2" />
              <span>{formatTime(hours, minutes, seconds)}</span>
            </div>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={isRunning ? pause : start}
              >
                {isRunning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => reset()}
              >
                Reset
              </Button>
            </div>
            {!isSuperset && (
              <div>
                <Button
                  type="button"
                  onClick={() => {
                    handleExerciseDataChange(exercise.id, 'duration', formatTime(hours, minutes, seconds));
                    handleAddExerciseResult(exercise.id);
                  }}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Log Exercise
                </Button>
              </div>
            )}
          </div>
        );

      case 'duration_distance':
        return (
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <Ruler className="h-4 w-4 mr-1 text-muted-foreground" />
                  <Label>Distance (miles)</Label>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.distance || ''}
                  onChange={(e) => handleExerciseDataChange(exercise.id, 'distance', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <Label>Duration (hh:mm:ss)</Label>
                </div>
                <Input
                  type="text"
                  placeholder="00:00:00"
                  value={data.duration || ''}
                  onChange={(e) => handleExerciseDataChange(exercise.id, 'duration', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            {!isSuperset && (
              <div>
                <Button
                  type="button"
                  onClick={() => handleAddExerciseResult(exercise.id)}
                  disabled={!data.distance || !data.duration || isLogging}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Log Exercise
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return <div>Unsupported exercise type</div>;
    }
  };

  const renderSupersetControls = () => {
    if (!isSuperset || !currentExercises.length) return null;

    const allCompleted = allExercisesInGroupCompleted();
    const anyDataMissing = currentExercises.some(ex => {
      const data = exerciseData[ex.id] || {};
      if (ex.exercise?.log_type === 'weight_reps') {
        return !data.reps || !data.sets;
      } else if (ex.exercise?.log_type === 'duration_distance') {
        return !data.distance || !data.duration;
      }
      return false;
    });

    return (
      <div className="mt-4">
        <Button
          type="button"
          onClick={() => {
            currentExercises.forEach(ex => {
              if (!ex.completed && exerciseData[ex.id]) {
                handleAddExerciseResult(ex.id);
              }
            });
          }}
          disabled={anyDataMissing || allCompleted || isLogging}
          className="w-full"
        >
          <Check className="h-4 w-4 mr-2" />
          Log Superset
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return <div className="py-12 flex justify-center">Loading workout details...</div>;
  }

  if (!workoutCompletion || exercises.length === 0) {
    return <div className="py-12 flex justify-center">Workout not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{workoutCompletion.workout?.title}</h1>
        <p className="text-muted-foreground">
          {workoutCompletion.workout?.description || 'No description provided'}
        </p>
      </div>

      <Separator />

      {currentExercises.length > 0 ? (
        <Card className="bg-muted/30">
          <CardHeader>
            {isSuperset ? (
              <>
                <CardTitle>
                  <div className="flex items-center">
                    <Dumbbell className="h-5 w-5 mr-2 text-primary" />
                    <span>Superset: {getSupersetTitle(currentExerciseGroup)}</span>
                  </div>
                </CardTitle>
                <CardDescription>
                  Complete all exercises with minimal rest between them
                </CardDescription>
              </>
            ) : (
              <CardTitle>
                {currentExerciseIndex + 1}/{groupKeys.length}: {currentExercises[0]?.exercise?.name}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isSuperset ? (
              <div className="space-y-6">
                {currentExercises.map((exercise, index) => (
                  <div key={exercise.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-lg mb-2">
                      {index + 1}. {exercise.exercise?.name}
                    </h3>
                    {exercise.completed ? (
                      <div className="flex items-center text-green-600 font-medium">
                        <Check className="h-5 w-5 mr-2" />
                        Completed
                      </div>
                    ) : (
                      renderExerciseForm(exercise)
                    )}
                  </div>
                ))}
                {renderSupersetControls()}
              </div>
            ) : (
              renderExerciseForm(currentExercises[0])
            )}

            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={handleSkipWorkout}
                disabled={isSkipping}
              >
                {isSkipping ? (
                  <>
                    Skipping...
                    <SkipForward className="h-4 w-4 ml-2 animate-spin" />
                  </>
                ) : (
                  <>
                    Skip Workout
                    <SkipForward className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <Button
                onClick={handleNextExercise}
                disabled={!allExercisesInGroupCompleted()}
              >
                {allExercisesInGroupCompleted() ? (
                  <>
                    Next
                    <Flag className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Complete All Exercises
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">Workout Complete!</h2>
          <p className="text-muted-foreground mb-6">
            Congratulations on finishing your workout.
          </p>
          <Button onClick={handleCompleteWorkout} disabled={isCompleting}>
            {isCompleting ? 'Completing...' : 'Complete Workout'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActiveWorkout;
