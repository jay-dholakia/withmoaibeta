
export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string | null;
  created_at: string;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  description: string | null;
  weeks: number; // Changed from 'WorkoutWeek[] | number' to just 'number'
  coach_id: string;
  created_at: string;
  updated_at: string;
  // Add a field to store the actual weeks data when needed
  weekData?: WorkoutWeek[];
}

export interface WorkoutWeek {
  id: string;
  program_id: string;
  week_number: number;
  title: string;
  description: string | null;
  created_at: string;
  program?: {
    title: string;
    id: string;
  } | null;
  workouts?: Workout[];
}

export interface Workout {
  id: string;
  week_id: string;
  day_of_week: number;
  title: string;
  description: string | null;
  created_at: string;
  workout_exercises?: WorkoutExercise[];
  workout_type?: WorkoutType;
}

export interface StandaloneWorkout {
  id: string;
  title: string;
  description: string | null;
  coach_id: string;
  created_at: string;
  updated_at?: string;
  category?: string;
  workout_exercises?: WorkoutExercise[];
  workout_type?: WorkoutType;
}

export interface WorkoutBasic {
  id: string;
  title: string;
  description?: string;
  day_of_week: number;
  week_id: string;
  week?: {
    week_number: number;
    program?: {
      id: string;
      title: string;
    }
  } | null;
  workout_exercises?: WorkoutExercise[];
  workout_type?: WorkoutType;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  // Optional joined data
  exercise?: Exercise;
  workout?: Workout;
}

export interface ProgramAssignment {
  id: string;
  program_id: string;
  user_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface WorkoutHistoryItem {
  id: string;
  completed_at: string;
  notes?: string;
  rating?: number;
  user_id: string;
  workout_id: string;
  workout?: WorkoutBasic | null;
  life_happens_pass?: boolean;
  rest_day?: boolean;
}

export type WorkoutType = 'cardio' | 'strength' | 'mobility' | 'flexibility';

export const WORKOUT_TYPES: WorkoutType[] = ['cardio', 'strength', 'mobility', 'flexibility'];

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday', 
  'Saturday'
];
