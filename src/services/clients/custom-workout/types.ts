
import { Database } from '@/integrations/supabase/types';

export interface CustomWorkout {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  workout_type: string;
  workout_date: string | null;
}

export interface CustomWorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string | null;
  custom_exercise_name: string | null;
  sets: number | null;
  reps: string | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  exercise?: {
    id: string;
    name: string;
    category: string;
    description: string | null;
  };
}

export interface CreateCustomWorkoutExerciseParams {
  workout_id: string;
  exercise_id?: string | null;
  custom_exercise_name?: string | null;
  sets?: number | null;
  reps?: string | null;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index: number;
}
