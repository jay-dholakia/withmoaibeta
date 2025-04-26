
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
  const [sortedExerciseIds, setSortedExerciseIds] = useState<string[]>([]);

  useEffect(() => {
    if (workoutExercises && !workoutDataInitialized) {
      const initialState: ExerciseStates = {};
      const orderedExerciseIds: string[] = [];
      
      // Sort exercises by order_index if available
      const sortedExercises = [...workoutExercises].sort((a, b) => {
        // Use order_index as primary sort field if available on both
        if (a.order_index !== undefined && b.order_index !== undefined) {
          return a.order_index - b.order_index;
        }
        // Fall back to array order if order_index not available
        return 0;
      });
      
      // Store the sorted exercise IDs
      sortedExercises.forEach(exercise => {
        orderedExerciseIds.push(exercise.id);
      });
      
      // Set the sorted exercise IDs
      setSortedExerciseIds(orderedExerciseIds);
      
      sortedExercises.forEach((exercise) => {
        const exerciseType = exercise.exercise?.exercise_type || 'strength';
        const exerciseName = (exercise.exercise?.name || '').toLowerCase();
        const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
        
        // Always store the exercise's unique exercise_id in all exercise states
        if (isRunExercise) {
          initialState[exercise.id] = {
            expanded: true,
            exercise_id: exercise.exercise?.id, // Initialize with the exercise ID
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
            exercise_id: exercise.exercise?.id, // Initialize with the exercise ID
            sets,
          };
        } else if (exerciseType === 'cardio') {
          initialState[exercise.id] = {
            expanded: true,
            exercise_id: exercise.exercise?.id, // Initialize with the exercise ID
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
            exercise_id: exercise.exercise?.id, // Initialize with the exercise ID
            sets: [],
            flexibilityData: {
              duration: '',
              completed: false
            }
          };
        }
        
        // Log each exercise we're initializing
        console.log(`Initialized exercise state for ${exerciseName}`, {
          workoutExerciseId: exercise.id,
          exerciseId: exercise.exercise?.id,
          exerciseType,
          orderIndex: exercise.order_index
        });
      });
      
      setExerciseStates(initialState);
      setWorkoutDataInitialized(true);
      toast.success('Workout initialized');
    }
  }, [workoutExercises, workoutDataInitialized]);

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
    sortedExerciseIds
  };
};
