
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Stopwatch from '@/components/client/Stopwatch';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { toast } from 'sonner';
import { fetchWorkoutExercises } from '@/services/client-workout-history-service';
import { StrengthExercise } from '@/components/client/workout/StrengthExercise';
import { CardioExercise } from '@/components/client/workout/CardioExercise';
import { FlexibilityExercise } from '@/components/client/workout/FlexibilityExercise';
import { RunExercise } from '@/components/client/workout/RunExercise';

const ActiveWorkout: React.FC = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
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
    triggerAutosave
  } = useWorkoutState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch workout exercises
  const { data: workoutExercises, isLoading: exercisesLoading } = useQuery({
    queryKey: ['workout-exercises', workoutCompletionId],
    queryFn: () => fetchWorkoutExercises(workoutCompletionId || ''),
    enabled: !!workoutCompletionId,
  });

  useEffect(() => {
    // Set loading state based on the query
    setIsLoading(exercisesLoading);
  }, [exercisesLoading]);

  // Mock saveAllSetsMutation for now since we don't have its implementation
  const saveAllSetsMutation = useMutation({
    mutationFn: async () => {
      // Trigger autosave before completing the workout
      triggerAutosave();
      
      // This would be implemented with actual API calls to save workout data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Workout completed successfully!');
      return true;
    }
  });

  // Helper functions for exercise interaction
  const formatDurationInput = (value: string): string => {
    // Format duration input to hh:mm:ss format
    // For now, just return the value as is
    return value;
  };

  const onSetChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseStates(prev => {
      const newStates = {...prev};
      if (newStates[exerciseId] && newStates[exerciseId].sets && newStates[exerciseId].sets[setIndex]) {
        newStates[exerciseId].sets[setIndex][field] = value;
      }
      return newStates;
    });
  };

  const onSetCompletion = (exerciseId: string, setIndex: number, completed: boolean) => {
    setExerciseStates(prev => {
      const newStates = {...prev};
      if (newStates[exerciseId] && newStates[exerciseId].sets && newStates[exerciseId].sets[setIndex]) {
        newStates[exerciseId].sets[setIndex].completed = completed;
      }
      return newStates;
    });
  };

  const onCardioChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates(prev => {
      const newStates = {...prev};
      if (newStates[exerciseId] && newStates[exerciseId].cardioData) {
        newStates[exerciseId].cardioData[field] = value;
      }
      return newStates;
    });
  };

  const onCardioCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates(prev => {
      const newStates = {...prev};
      if (newStates[exerciseId] && newStates[exerciseId].cardioData) {
        newStates[exerciseId].cardioData.completed = completed;
      }
      return newStates;
    });
  };

  const onFlexibilityChange = (exerciseId: string, field: 'duration', value: string) => {
    setExerciseStates(prev => {
      const newStates = {...prev};
      if (newStates[exerciseId] && newStates[exerciseId].flexibilityData) {
        newStates[exerciseId].flexibilityData[field] = value;
      }
      return newStates;
    });
  };

  const onFlexibilityCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates(prev => {
      const newStates = {...prev};
      if (newStates[exerciseId] && newStates[exerciseId].flexibilityData) {
        newStates[exerciseId].flexibilityData.completed = completed;
      }
      return newStates;
    });
  };

  const onRunChange = (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => {
    setExerciseStates(prev => {
      const newStates = {...prev};
      if (newStates[exerciseId] && newStates[exerciseId].runData) {
        newStates[exerciseId].runData[field] = value;
      }
      return newStates;
    });
  };

  const onRunCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates(prev => {
      const newStates = {...prev};
      if (newStates[exerciseId] && newStates[exerciseId].runData) {
        newStates[exerciseId].runData.completed = completed;
      }
      return newStates;
    });
  };

  const onVideoClick = (url: string, name: string) => {
    // Handle video demo click
    window.open(url, '_blank');
  };

  const onSwapClick = (exercise: any) => {
    // Handle swap exercise click
    console.log('Swap exercise:', exercise);
    // This would be implemented with actual swap exercise functionality
  };

  // Group exercises by their type
  const groupedExercises = React.useMemo(() => {
    if (!workoutExercises) return { strength: [], cardio: [], flexibility: [], running: [] };
    
    return workoutExercises.reduce((acc, item) => {
      const exerciseType = item.workout_exercise?.exercise?.exercise_type || 'strength';
      const exerciseName = (item.workout_exercise?.exercise?.name || '').toLowerCase();
      const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
      
      if (isRunExercise) {
        acc.running.push(item);
      } else if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
        acc.strength.push(item);
      } else if (exerciseType === 'cardio') {
        acc.cardio.push(item);
      } else if (exerciseType === 'flexibility') {
        acc.flexibility.push(item);
      }
      
      return acc;
    }, { strength: [], cardio: [], flexibility: [], running: [] });
  }, [workoutExercises]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your workout...</p>
      </div>
    );
  }

  if (!workoutExercises || workoutExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <h2 className="text-xl font-bold mb-4">No exercises found</h2>
        <p className="text-gray-500 mb-6">This workout doesn't have any exercises assigned.</p>
        <Link to="/client-dashboard/workouts">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="container max-w-3xl px-4 pt-4">
        <h2 className="text-2xl font-semibold mb-4">Your Workout</h2>
        
        {/* Strength exercises */}
        {groupedExercises.strength.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Strength Exercises</h3>
            <div className="space-y-4">
              {groupedExercises.strength.map((exerciseData) => (
                <div key={exerciseData.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">
                    {exerciseData.workout_exercise?.exercise?.name || "Unknown Exercise"}
                  </h4>
                  <StrengthExercise 
                    exercise={exerciseData.workout_exercise}
                    exerciseState={exerciseStates[exerciseData.workout_exercise_id] || {}}
                    personalRecord={null}
                    onSetChange={onSetChange}
                    onSetCompletion={onSetCompletion}
                    onVideoClick={onVideoClick}
                    onSwapClick={onSwapClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Cardio exercises */}
        {groupedExercises.cardio.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Cardio Exercises</h3>
            <div className="space-y-4">
              {groupedExercises.cardio.map((exerciseData) => (
                <div key={exerciseData.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">
                    {exerciseData.workout_exercise?.exercise?.name || "Unknown Exercise"}
                  </h4>
                  <CardioExercise 
                    exercise={exerciseData.workout_exercise}
                    exerciseState={exerciseStates[exerciseData.workout_exercise_id] || {}}
                    formatDurationInput={formatDurationInput}
                    onCardioChange={onCardioChange}
                    onCardioCompletion={onCardioCompletion}
                    onVideoClick={onVideoClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Flexibility exercises */}
        {groupedExercises.flexibility.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Flexibility Exercises</h3>
            <div className="space-y-4">
              {groupedExercises.flexibility.map((exerciseData) => (
                <div key={exerciseData.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">
                    {exerciseData.workout_exercise?.exercise?.name || "Unknown Exercise"}
                  </h4>
                  <FlexibilityExercise 
                    exercise={exerciseData.workout_exercise}
                    exerciseState={exerciseStates[exerciseData.workout_exercise_id] || {}}
                    formatDurationInput={formatDurationInput}
                    onFlexibilityChange={onFlexibilityChange}
                    onFlexibilityCompletion={onFlexibilityCompletion}
                    onVideoClick={onVideoClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Running exercises */}
        {groupedExercises.running.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Running</h3>
            <div className="space-y-4">
              {groupedExercises.running.map((exerciseData) => (
                <div key={exerciseData.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">
                    {exerciseData.workout_exercise?.exercise?.name || "Unknown Exercise"}
                  </h4>
                  <RunExercise 
                    exercise={exerciseData.workout_exercise}
                    exerciseState={exerciseStates[exerciseData.workout_exercise_id] || {}}
                    formatDurationInput={formatDurationInput}
                    onRunChange={onRunChange}
                    onRunCompletion={onRunCompletion}
                    onVideoClick={onVideoClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show a message if no exercises are grouped correctly */}
        {Object.values(groupedExercises).every(group => group.length === 0) && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-center text-gray-500">
              There was an issue categorizing exercises. Please refresh or contact support.
            </p>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-background pb-2 pt-2 z-10 border-t border-gray-200">
        <div className="container max-w-3xl px-4">
          <div className="flex justify-center items-center mb-2">
            <Stopwatch />
          </div>
        
          <Button 
            variant="default" 
            size="lg" 
            onClick={() => saveAllSetsMutation.mutate()} 
            disabled={saveAllSetsMutation.isPending}
            className="w-full text-lg flex items-center"
          >
            {saveAllSetsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" /> Complete Workout
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkout;
