// Keep this file minimal as we need to maintain backward compatibility
// via useWorkoutState.ts which depends on this file

import { useInterpret, useSelector } from '@xstate/react';
import { workoutMachine } from '@/machines/workoutMachine';

export const useWorkoutMachine = () => {
  // Use the new XState v5 API to create and interpret the machine
  const workoutActor = useInterpret(workoutMachine);
  
  // Extract state values using useSelector for better performance
  return {
    // Forward the entire actor and state to maintain compatibility
    service: workoutActor,
    state: workoutActor.getSnapshot(),
    
    // Extract common state properties
    send: workoutActor.send,
    context: useSelector(workoutActor, state => state.context),
    currentExerciseIndex: useSelector(workoutActor, state => state.context.currentExerciseIndex),
    activeWorkout: useSelector(workoutActor, state => state.context.activeWorkout),
    isComplete: useSelector(workoutActor, state => state.matches('complete')),
    
    // Add more selectors as needed for compatibility with existing code
    matches: (state: string) => workoutActor.getSnapshot().matches(state)
  };
};
