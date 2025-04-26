
import { useState, useEffect } from 'react';
import { ExerciseStates, PendingSet, PendingCardio, PendingFlexibility, PendingRun } from '@/types/active-workout';
import { WorkoutExercise } from '@/types/workout';
import { toast } from 'sonner';

export const useWorkoutState = (
  workoutExercises: WorkoutExercise[] | undefined,
  initialDraftData?: ExerciseStates
) => {
  const [exerciseStates, setExerciseStates] = useState<ExerciseStates>({});
  const [pendingSets, setPendingSets] = useState<PendingSet[]>([]);
  const [pendingCardio, setPendingCardio] = useState<PendingCardio[]>([]);
  const [pendingFlexibility, setPendingFlexibility] = useState<PendingFlexibility[]>([]);
  const [pendingRuns, setPendingRuns] = useState<PendingRun[]>([]);
  const [workoutDataInitialized, setWorkoutDataInitialized] = useState(false);
  const [sortedExerciseIds, setSortedExerciseIds] = useState<string[]>([]);

  // Initialize state from draft data or create new state
  useEffect(() => {
    if (workoutExercises && !workoutDataInitialized) {
      console.log("useWorkoutState: Initializing exercise states", {
        hasInitialDraft: !!initialDraftData,
        exerciseCount: workoutExercises.length
      });

      if (initialDraftData && Object.keys(initialDraftData).length > 0) {
        console.log("Using existing draft data for initialization");
        setExerciseStates(initialDraftData);
        setWorkoutDataInitialized(true);
        return;
      }

      // Only initialize new state if no draft exists
      const initialState: ExerciseStates = {};
      const orderedExerciseIds: string[] = [];
      
      const sortedExercises = [...workoutExercises].sort((a, b) => {
        if (a.order_index !== undefined && b.order_index !== undefined) {
          return a.order_index - b.order_index;
        }
        return 0;
      });
      
      sortedExercises.forEach(exercise => {
        orderedExerciseIds.push(exercise.id);
      });
      
      setSortedExerciseIds(orderedExerciseIds);
      
      sortedExercises.forEach((exercise) => {
        const exerciseType = exercise.exercise?.exercise_type || 'strength';
        const exerciseName = (exercise.exercise?.name || '').toLowerCase();
        const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
        
        if (isRunExercise) {
          initialState[exercise.id] = {
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
          
          initialState[exercise.id] = {
            expanded: true,
            exercise_id: exercise.exercise?.id,
            currentExercise: exercise.exercise,
            sets,
          };
        } else if (exerciseType === 'cardio') {
          initialState[exercise.id] = {
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
          initialState[exercise.id] = {
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
        
        console.log(`Initialized exercise state for ${exerciseName}`, {
          workoutExerciseId: exercise.id,
          exerciseId: exercise.exercise?.id,
          exerciseType,
          orderIndex: exercise.order_index
        });
      });
      
      setExerciseStates(initialState);
      setWorkoutDataInitialized(true);
      
      if (sortedExercises.length > 0 && !initialDraftData) {
        toast.success(`Workout initialized with ${sortedExercises.length} exercises`);
      }
    }
  }, [workoutExercises, workoutDataInitialized, initialDraftData]);

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
