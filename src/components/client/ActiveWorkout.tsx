
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Clock, BarChart, Check, SkipForward, Play, Flag, Timer, Ruler, Dumbbell, ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [exerciseData, setExerciseData] = useState<Record<string, any>>({});
  const [isLogging, setIsLogging] = useState(false);
  const [supersetGroups, setSupersetGroups] = useState<SupersetGroup[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});

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

        // Initialize expanded state for all exercises
        const initialExpandedState: Record<string, boolean> = {};
        exercisesData.forEach(ex => {
          initialExpandedState[ex.id] = true;
        });
        setExpandedExercises(initialExpandedState);

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

  const allExercisesCompleted = () => {
    if (exercises.length === 0) return false;
    return exercises.every(ex => ex.completed);
  };

  const toggleExerciseExpanded = (exerciseId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
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
            <div className="grid grid-cols-3 gap-3">
              <div>
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
              <div>
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
              <div>
                <div className="flex items-center mb-1">
                  <BarChart className="h-4 w-4 mr-1 text-muted-foreground" />
                  <Label>Weight (lbs)</Label>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="2.5"
                  value={data.weight || ''}
                  onChange={(e) => handleExerciseDataChange(exercise.id, 'weight', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
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
          </div>
        );

      default:
        return <div>Unsupported exercise type</div>;
    }
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

      <div className="space-y-6">
        {/* List of all exercises */}
        {Object.keys(groupedExercises).map(groupKey => {
          const exerciseGroup = groupedExercises[groupKey];
          const isSuperset = !groupKey.startsWith('single-');
          
          return (
            <Card key={groupKey} className="bg-muted/30">
              <CardHeader className="pb-2">
                {isSuperset ? (
                  <CardTitle>
                    <div className="flex items-center">
                      <Dumbbell className="h-5 w-5 mr-2 text-primary" />
                      <span>Superset: {getSupersetTitle(groupKey)}</span>
                    </div>
                  </CardTitle>
                ) : (
                  <CardTitle>
                    {exerciseGroup[0]?.exercise?.name}
                  </CardTitle>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {exerciseGroup.map(exercise => (
                  <div key={exercise.id} className="border rounded-lg p-4">
                    {isSuperset && (
                      <h3 className="font-medium text-lg mb-3">
                        {exercise.exercise?.name}
                      </h3>
                    )}
                    
                    {exercise.completed ? (
                      <div className="flex items-center text-green-600 font-medium">
                        <Check className="h-5 w-5 mr-2" />
                        Completed
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center cursor-pointer" 
                             onClick={() => toggleExerciseExpanded(exercise.id)}>
                          <span className="font-medium">Exercise Details</span>
                          {expandedExercises[exercise.id] ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />}
                        </div>
                        
                        {expandedExercises[exercise.id] && renderExerciseForm(exercise)}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* Complete Workout Button */}
        <div className="flex justify-between pt-4">
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
            onClick={handleCompleteWorkout}
            disabled={!allExercisesCompleted() || isCompleting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isCompleting ? (
              "Completing..."
            ) : (
              <>
                Complete Workout
                <Check className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkout;
