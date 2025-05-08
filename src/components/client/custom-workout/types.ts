
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
