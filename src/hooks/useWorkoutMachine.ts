
import { useMachine } from '@xstate/react';
import { workoutMachine } from '@/machines/workoutMachine';
import { WorkoutExercise } from '@/types/workout';
import { ExerciseStates, PendingSet, PendingCardio, PendingFlexibility, PendingRun } from '@/types/active-workout';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const useWorkoutMachine = (
  workoutExercises: WorkoutExercise[] | undefined,
  initialDraftData?: ExerciseStates
) => {
  // Initialize the machine with the workout data
  const [state, send] = useMachine(workoutMachine);
  
  // Initialize workout data when exercises are available
  useEffect(() => {
    if (workoutExercises && workoutExercises.length > 0 && !state.context.workoutDataInitialized) {
      console.log("useWorkoutMachine: Initializing exercise states", {
        hasInitialDraft: !!initialDraftData,
        exerciseCount: workoutExercises.length
      });
      
      send({ 
        type: 'INITIALIZE', 
        workoutExercises, 
        draftData: initialDraftData 
      });
      
      if (!initialDraftData && workoutExercises.length > 0) {
        toast.success(`Workout initialized with ${workoutExercises.length} exercises`);
      }
    }
  }, [workoutExercises, initialDraftData, state.context.workoutDataInitialized, send]);
  
  // Create convenient setter functions that send events to the machine
  const setExerciseStates = (states: ExerciseStates) => {
    send({ type: 'UPDATE_EXERCISE_STATES', states });
  };
  
  const setPendingSets = (sets: PendingSet[]) => {
    send({ type: 'UPDATE_PENDING_SETS', sets });
  };
  
  const setPendingCardio = (cardio: PendingCardio[]) => {
    send({ type: 'UPDATE_PENDING_CARDIO', cardio });
  };
  
  const setPendingFlexibility = (flexibility: PendingFlexibility[]) => {
    send({ type: 'UPDATE_PENDING_FLEXIBILITY', flexibility });
  };
  
  const setPendingRuns = (runs: PendingRun[]) => {
    send({ type: 'UPDATE_PENDING_RUNS', runs });
  };
  
  const toggleExerciseExpanded = (exerciseId: string) => {
    send({ type: 'TOGGLE_EXERCISE_EXPANDED', exerciseId });
  };
  
  return {
    // Return the current state values from the machine
    exerciseStates: state.context.exerciseStates,
    pendingSets: state.context.pendingSets,
    pendingCardio: state.context.pendingCardio,
    pendingFlexibility: state.context.pendingFlexibility,
    pendingRuns: state.context.pendingRuns,
    workoutDataInitialized: state.context.workoutDataInitialized,
    sortedExerciseIds: state.context.sortedExerciseIds,
    
    // Return the setter functions
    setExerciseStates,
    setPendingSets,
    setPendingCardio,
    setPendingFlexibility,
    setPendingRuns,
    
    // Add additional functionality
    toggleExerciseExpanded,
    
    // Add machine state
    currentState: state.value
  };
};
