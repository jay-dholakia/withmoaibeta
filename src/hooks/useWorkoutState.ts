
import { useState, useEffect } from 'react';
import { ExerciseStates, PendingSet, PendingCardio, PendingFlexibility, PendingRun } from '@/types/active-workout';
import { WorkoutExercise } from '@/types/workout';
import { toast } from 'sonner';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const useWorkoutState = (workoutExercises: WorkoutExercise[] | undefined) => {
  const [exerciseStates, setExerciseStates] = useState<ExerciseStates>({});
  const [pendingSets, setPendingSets] = useState<PendingSet[]>([]);
  const [pendingCardio, setPendingCardio] = useState<PendingCardio[]>([]);
  const [pendingFlexibility, setPendingFlexibility] = useState<PendingFlexibility[]>([]);
  const [pendingRuns, setPendingRuns] = useState<PendingRun[]>([]);
  const [workoutDataInitialized, setWorkoutDataInitialized] = useState(false);
  const [forceAutosaveCounter, setForceAutosaveCounter] = useState(0);

  useEffect(() => {
    if (workoutExercises && !workoutDataInitialized) {
      const initialState: ExerciseStates = {};
      
      workoutExercises.forEach((exercise) => {
        const exerciseType = exercise.exercise?.exercise_type || 'strength';
        const exerciseName = (exercise.exercise?.name || '').toLowerCase();
        const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
        
        if (isRunExercise) {
          initialState[exercise.id] = {
            expanded: true,
            sets: [],
            runData: {
              distance: '',
              duration: '',
              location: '',
              completed: false
            }
          };
        } else if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
          const sets = Array.from({ length: exercise.sets || 1 }, (_, i) => ({
            setNumber: i + 1,
            weight: '',
            reps: exercise.reps || '',
            completed: false,
          }));
          
          initialState[exercise.id] = {
            expanded: true,
            sets,
          };
        } else if (exerciseType === 'cardio') {
          initialState[exercise.id] = {
            expanded: true,
            sets: [],
            cardioData: {
              distance: '',
              duration: '',
              location: '',
              completed: false
            }
          };
        } else if (exerciseType === 'flexibility') {
          initialState[exercise.id] = {
            expanded: true,
            sets: [],
            flexibilityData: {
              duration: '',
              completed: false
            }
          };
        }
      });
      
      setExerciseStates(initialState);
      setWorkoutDataInitialized(true);
      toast.success('Workout initialized');
    }
  }, [workoutExercises, workoutDataInitialized]);

  // Function to trigger a force autosave
  const triggerAutosave = () => {
    setForceAutosaveCounter(prev => prev + 1);
  };

  return {
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
    workoutDataInitialized,
    forceAutosaveCounter,
    triggerAutosave
  };
};
