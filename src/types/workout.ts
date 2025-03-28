export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string | null;
  created_at: string;
  exercise_type: string; // Changed from enum to string
}

export interface WorkoutProgram {
  id: string;
  title: string;
  description: string | null;
  weeks: number;
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
  workout_type?: string; // Changed to allow any string
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
  workout_type?: string; // Changed to allow any string
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
  workout_type?: string; // Changed to allow any string
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
  title?: string; // Add this to support the title property
  workout_type?: string; // Add this to support the workout_type property
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

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday', 
  'Saturday'
];
