
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  const handleSetDataChange = (exerciseId: string, setIndex: number, field: string, value: any) => {
    setExerciseData(prev => {
      const exerciseResults = prev[exerciseId] || { sets: [] };
      const sets = [...(exerciseResults.sets || [])];
      
      // Make sure we have enough sets in the array
      while (sets.length <= setIndex) {
        sets.push({});
      }
      
      // Update the specific field for the set
      sets[setIndex] = {
        ...sets[setIndex],
        [field]: value
      };
      
      return {
        ...prev,
        [exerciseId]: {
          ...exerciseResults,
          sets: sets
        }
      };
    });
  };

  const handleCompleteSet = async (exerciseId: string, setIndex: number) => {
    const exerciseResult = exerciseData[exerciseId];
    if (!exerciseResult || !exerciseResult.sets || !exerciseResult.sets[setIndex]) {
      toast.error('Please enter values for this set first');
      return;
    }

    const setData = exerciseResult.sets[setIndex];
    if (!setData.reps || (setData.weight === undefined && !isCardioExercise(exerciseId))) {
      toast.error('Please enter all required values');
      return;
    }

    try {
      setIsLogging(true);
      
      // Mark this set as completed
      setExerciseData(prev => {
        const exerciseResults = prev[exerciseId] || { sets: [] };
        const sets = [...(exerciseResults.sets || [])];
        
        // Update the completed status
        sets[setIndex] = {
          ...sets[setIndex],
          completed: true
        };
        
        return {
          ...prev,
          [exerciseId]: {
            ...exerciseResults,
            sets: sets
          }
        };
      });

      // Check if all sets are completed for this exercise
      const allSetsCompleted = () => {
        const exerciseResult = exerciseData[exerciseId];
        if (!exerciseResult || !exerciseResult.sets) return false;
        
        // Get number of sets from the exercise data
        const exercise = exercises.find(ex => ex.id === exerciseId);
        const totalSets = exercise?.sets || 1;
        
        // Check if we have the right number of completed sets
        return exerciseResult.sets.filter(set => set && set.completed).length >= totalSets;
      };

      // If all sets are completed, mark the exercise as completed
      if (allSetsCompleted()) {
        const updatedExercise = await updateWorkoutCompletionExercise(exerciseId, {
          result: exerciseData[exerciseId],
          completed: true
        });

        setExercises(prevExercises => 
          prevExercises.map(ex => ex.id === exerciseId ? updatedExercise : ex)
        );
      }

      toast.success('Set completed');
    } catch (error) {
      console.error('Error logging set:', error);
      toast.error('Failed to log set');
    } finally {
      setIsLogging(false);
    }
  };

  const isCardioExercise = (exerciseId: string): boolean => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise || !exercise.exercise) return false;
    
    return exercise.exercise.log_type === 'duration' || 
           exercise.exercise.log_type === 'duration_distance';
  };

  const getExerciseSets = (exerciseId: string): number => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return 1;
    
    // Get sets from the workout_exercise data if available
    if (exercise.sets) return exercise.sets;
    
    // Default to 3 sets if not specified
    return 3;
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

  const renderExerciseSets = (exercise: WorkoutCompletionExercise) => {
    if (!exercise.exercise) {
      return <div>Exercise information not available</div>;
    }

    const exerciseId = exercise.id;
    const numberOfSets = getExerciseSets(exerciseId);
    const logType = exercise.exercise.log_type;
    
    if (exercise.completed) {
      return (
        <div className="flex items-center text-green-600 font-medium">
          <Check className="h-5 w-5 mr-2" />
          Completed
        </div>
      );
    }

    switch (logType) {
      case 'weight_reps':
        return (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Set</TableHead>
                  <TableHead>Reps</TableHead>
                  <TableHead>Weight (lbs)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: numberOfSets }).map((_, setIndex) => {
                  const setData = exerciseData[exerciseId]?.sets?.[setIndex] || {};
                  const isCompleted = setData.completed;
                  
                  return (
                    <TableRow key={setIndex} className={isCompleted ? "bg-green-50" : ""}>
                      <TableCell>{setIndex + 1}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={setData.reps || ''}
                          onChange={(e) => handleSetDataChange(exerciseId, setIndex, 'reps', e.target.value)}
                          disabled={isCompleted}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="2.5"
                          value={setData.weight || ''}
                          onChange={(e) => handleSetDataChange(exerciseId, setIndex, 'weight', e.target.value)}
                          disabled={isCompleted}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        {isCompleted ? (
                          <div className="text-green-600 flex items-center justify-center">
                            <Check className="h-4 w-4 mr-1" />
                            Done
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleCompleteSet(exerciseId, setIndex)}
                            disabled={isLogging}
                            className="w-full"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
                  const exerciseResult = {
                    duration: formatTime(hours, minutes, seconds)
                  };
                  setExerciseData(prev => ({
                    ...prev,
                    [exerciseId]: exerciseResult
                  }));
                  
                  updateWorkoutCompletionExercise(exerciseId, {
                    result: exerciseResult,
                    completed: true
                  }).then(updatedExercise => {
                    setExercises(prevExercises => 
                      prevExercises.map(ex => ex.id === exerciseId ? updatedExercise : ex)
                    );
                    toast.success('Exercise logged successfully');
                  }).catch(error => {
                    console.error('Error logging exercise:', error);
                    toast.error('Failed to log exercise');
                  });
                }}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Complete Exercise
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
                  value={exerciseData[exerciseId]?.distance || ''}
                  onChange={(e) => {
                    setExerciseData(prev => ({
                      ...prev,
                      [exerciseId]: {
                        ...(prev[exerciseId] || {}),
                        distance: e.target.value
                      }
                    }));
                  }}
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
                  value={exerciseData[exerciseId]?.duration || ''}
                  onChange={(e) => {
                    setExerciseData(prev => ({
                      ...prev,
                      [exerciseId]: {
                        ...(prev[exerciseId] || {}),
                        duration: e.target.value
                      }
                    }));
                  }}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <Button
                type="button"
                onClick={() => {
                  const exerciseResult = exerciseData[exerciseId];
                  if (!exerciseResult || !exerciseResult.distance || !exerciseResult.duration) {
                    toast.error('Please enter distance and duration');
                    return;
                  }
                  
                  updateWorkoutCompletionExercise(exerciseId, {
                    result: exerciseResult,
                    completed: true
                  }).then(updatedExercise => {
                    setExercises(prevExercises => 
                      prevExercises.map(ex => ex.id === exerciseId ? updatedExercise : ex)
                    );
                    toast.success('Exercise logged successfully');
                  }).catch(error => {
                    console.error('Error logging exercise:', error);
                    toast.error('Failed to log exercise');
                  });
                }}
                disabled={!exerciseData[exerciseId]?.distance || !exerciseData[exerciseId]?.duration || isLogging}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Complete Exercise
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
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center cursor-pointer" 
                           onClick={() => toggleExerciseExpanded(exercise.id)}>
                        <span className="font-medium">Exercise Details</span>
                        {expandedExercises[exercise.id] ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />}
                      </div>
                      
                      {expandedExercises[exercise.id] && renderExerciseSets(exercise)}
                    </div>
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
