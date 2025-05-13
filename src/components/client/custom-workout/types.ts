
import { Exercise } from '@/types/workout';

export interface CustomExerciseItem {
  id: string; // Temporary id for UI purposes
  exercise?: Exercise;
  customName?: string;
  sets?: number;
  reps?: string;
  rest?: number;
  notes?: string;
}

export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'custom' | 'run' | 'rest_day' | 'one_off' | string;
