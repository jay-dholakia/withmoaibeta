
import { Exercise } from '@/types/workout';

export interface ExerciseState {
  expanded: boolean;
  exercise_id?: string; // Track the current exercise ID
  swapData?: {
    timestamp: string;
    originalExerciseId: string | null;
    replacementExerciseId: string;
  };
  currentExercise?: Exercise; // Added this property to store the current exercise
  sets: Array<{
    setNumber: number;
    weight: string;
    reps: string;
    completed: boolean;
  }>;
  cardioData?: {
    distance: string;
    duration: string;
    location: string;
    completed: boolean;
    workout_type: string; // Ensure workout_type is saved
  };
  flexibilityData?: {
    duration: string;
    completed: boolean;
    workout_type: string; // Ensure workout_type is saved
  };
  runData?: {
    distance: string;
    duration: string;
    location: string;
    completed: boolean;
    workout_type: string; // Ensure workout_type is saved
  };
}

export interface ExerciseStates {
  [key: string]: ExerciseState;
}

export interface PendingSet {
  exerciseId: string;
  setNumber: number;
  weight: string;
  reps: string;
}

export interface PendingCardio {
  exerciseId: string;
  distance: string;
  duration: string;
  location: string;
  completed: boolean;
  workout_type: string; // Ensure workout_type is passed
}

export interface PendingFlexibility {
  exerciseId: string;
  duration: string;
  completed: boolean;
  workout_type: string; // Ensure workout_type is passed
}

export interface PendingRun {
  exerciseId: string;
  distance: string;
  duration: string;
  location: string;
  completed: boolean;
  workout_type: string; // Ensure workout_type is passed
}
