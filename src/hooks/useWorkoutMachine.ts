// Keep this file minimal as we need to maintain backward compatibility
// via useWorkoutState.ts which depends on this file

import { useMachine } from '@xstate/react';
import { workoutMachine } from '@/machines/workoutMachine';

export const useWorkoutMachine = () => {
  // Use the new XState v5 API to create and interpret the machine
  const [state, send] = useMachine(workoutMachine);
  
  // Extract state values for better performance
  return {
    // Forward the state to maintain compatibility
    state,
    
    // Extract common state properties
    send,
    context: state.context,
    currentExerciseIndex: state.context.currentExerciseIndex,
    activeWorkout: state.context.activeWorkout,
    isComplete: state.matches('complete'),
    
    // Add more selectors as needed for compatibility with existing code
    matches: (stateName: string) => state.matches(stateName)
  };
};
