
// This file now re-exports the XState implementation for backward compatibility
import { useWorkoutMachine } from './useWorkoutMachine';

export const useWorkoutState = useWorkoutMachine;
