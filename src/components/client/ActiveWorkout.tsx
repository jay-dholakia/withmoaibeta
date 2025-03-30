import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Clock, BarChart, Check, SkipForward, Play, Flag, Timer, Ruler } from 'lucide-react';
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

  const currentExercise = exercises[currentExerciseIndex];

  const handleExerciseDataChange = (field: string, value: any) => {
    setExerciseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddExerciseResult = async () => {
    if (!workoutCompletionId || !currentExercise) return;

    try {
      setIsLogging(true);

      const updatedExercise = await updateWorkoutCompletionExercise(currentExercise.id, {
        result: exerciseData,
        completed: true
      });

      const updatedExercises = exercises.map(ex =>
        ex.id === currentExercise.id ? updatedExercise : ex
      );
      setExercises(updatedExercises);

      setExerciseData({});

      toast.success('Exercise logged successfully');
    } catch (error) {
      console.error('Error logging exercise:', error);
      toast.error('Failed to log exercise');
    } finally {
      setIsLogging(false);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
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

      {currentExercise ? (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>
              {currentExerciseIndex + 1}/{exercises.length}: {currentExercise.exercise?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentExercise.exercise?.log_type === 'weight_reps' && (
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
                      value={exerciseData.reps || ''}
                      onChange={(e) => handleExerciseDataChange('reps', e.target.value)}
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
                      value={exerciseData.sets || ''}
                      onChange={(e) => handleExerciseDataChange('sets', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={handleAddExerciseResult}
                    disabled={!exerciseData.reps || !exerciseData.sets}
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Log Exercise
                  </Button>
                </div>
              </div>
            )}

            {currentExercise.exercise?.log_type === 'duration' && (
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
                    onClick={handleAddExerciseResult}
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Log Exercise
                  </Button>
                </div>
              </div>
            )}

            {currentExercise.exercise?.log_type === 'duration_distance' && (
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
                      value={exerciseData.distance || ''}
                      onChange={(e) => handleExerciseDataChange('distance', e.target.value)}
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
                      value={exerciseData.duration || ''}
                      onChange={(e) => handleExerciseDataChange('duration', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={handleAddExerciseResult}
                    disabled={!exerciseData.distance || !exerciseData.duration}
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Log Exercise
                  </Button>
                </div>
              </div>
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
                disabled={currentExercise.completed}
              >
                {currentExercise.completed ? (
                  <>
                    Completed
                    <Check className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next Exercise
                    <Flag className="h-4 w-4 ml-2" />
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
