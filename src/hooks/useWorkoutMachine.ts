
import { useState, useCallback } from 'react';
import { WorkoutExercise } from '@/types/workout';

// This is a simplified replacement for the previous XState-based workout machine
export const useWorkoutMachine = () => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeWorkout, setActiveWorkout] = useState<{exercises: WorkoutExercise[]} | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const nextExercise = useCallback(() => {
    if (!activeWorkout) return;
    
    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentExerciseIndex, activeWorkout]);

  const previousExercise = useCallback(() => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  }, [currentExerciseIndex]);

  const setWorkout = useCallback((workout: {exercises: WorkoutExercise[]}) => {
    setActiveWorkout(workout);
    setCurrentExerciseIndex(0);
    setIsComplete(false);
  }, []);

  return {
    currentExerciseIndex,
    activeWorkout,
    isComplete,
    nextExercise,
    previousExercise,
    setWorkout,
    context: {
      currentExerciseIndex,
      activeWorkout
    }
  };
};
