import { useState, useEffect } from 'react';
import { ExerciseStates } from '@/types/active-workout';
import { WorkoutExercise } from '@/types/workout';
import { toast } from 'sonner';

interface UseWorkoutInitializationProps {
  workoutExercises: WorkoutExercise[];
  draftData: any;
  draftLoaded: boolean;
  workoutDataLoaded: boolean;
}

export const useWorkoutInitialization = ({
  workoutExercises,
  draftData,
  draftLoaded,
  workoutDataLoaded
}: UseWorkoutInitializationProps) => {
  const [exerciseStates, setExerciseStates] = useState<ExerciseStates>({});
  const [sortedExerciseIds, setSortedExerciseIds] = useState<string[]>([]);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // This effect handles the initialization of workout data
  useEffect(() => {
    // Only proceed when both workout data and draft loading status are confirmed
    if (!workoutDataLoaded || workoutExercises.length === 0 || !draftLoaded) {
      console.log("Waiting for workout data and draft loading to complete", {
        workoutDataLoaded,
        exercisesLength: workoutExercises.length,
        draftLoaded
      });
      return;
    }

    // If we're already initialized, don't reinitialize
    if (initializationComplete && Object.keys(exerciseStates).length > 0) {
      console.log("Workout already initialized, skipping");
      return;
    }
    
    console.log("Initializing workout states", {
      hasDraftData: !!(draftData?.exerciseStates && Object.keys(draftData?.exerciseStates || {}).length > 0),
      workoutExercisesCount: workoutExercises.length
    });

    // Get the sorted exercise IDs from workout exercises
    const orderedExerciseIds = workoutExercises.map(exercise => exercise.id);
    setSortedExerciseIds(orderedExerciseIds);

    // If we have valid draft data, use it
    if (draftData?.exerciseStates && Object.keys(draftData.exerciseStates).length > 0) {
      console.log("Initializing from draft data:", draftData.exerciseStates);
      setExerciseStates(draftData.exerciseStates);
      toast.success("Loaded your saved workout progress");
    } else {
      // Otherwise, build exercise states from scratch
      console.log("No draft data found, initializing from workout exercises");
      const initialState = buildInitialExerciseState(workoutExercises);
      setExerciseStates(initialState);
    }
    
    setInitializationComplete(true);
  }, [workoutDataLoaded, workoutExercises, draftData, draftLoaded, initializationComplete, exerciseStates]);

  // Helper function to build initial exercise state from workout exercises
  const buildInitialExerciseState = (exercises: WorkoutExercise[]): ExerciseStates => {
    const initialState: ExerciseStates = {};
    
    const sortedExercises = [...exercises].sort((a, b) => {
      if (a.order_index !== undefined && b.order_index !== undefined) {
        return a.order_index - b.order_index;
      }
      return 0;
    });
    
    sortedExercises.forEach((exercise) => {
      if (!exercise || !exercise.id) {
        console.error("Exercise missing ID:", exercise);
        return;
      }
      
      const exerciseId = exercise.id;
      const exerciseType = exercise.exercise?.exercise_type || 'strength';
      const exerciseName = (exercise.exercise?.name || '').toLowerCase();
      const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
      
      if (isRunExercise) {
        initialState[exerciseId] = {
          expanded: true,
          exercise_id: exercise.exercise?.id,
          currentExercise: exercise.exercise,
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
        
        initialState[exerciseId] = {
          expanded: true,
          exercise_id: exercise.exercise?.id,
          currentExercise: exercise.exercise,
          sets,
        };
      } else if (exerciseType === 'cardio') {
        initialState[exerciseId] = {
          expanded: true,
          exercise_id: exercise.exercise?.id,
          currentExercise: exercise.exercise,
          sets: [],
          cardioData: {
            distance: '',
            duration: '',
            location: '',
            completed: false
          }
        };
      } else if (exerciseType === 'flexibility') {
        initialState[exerciseId] = {
          expanded: true,
          exercise_id: exercise.exercise?.id,
          currentExercise: exercise.exercise,
          sets: [],
          flexibilityData: {
            duration: '',
            completed: false
          }
        };
      }
    });
    
    return initialState;
  };

  return {
    exerciseStates,
    setExerciseStates,
    sortedExerciseIds,
    initializationComplete
  };
};
