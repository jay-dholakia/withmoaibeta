export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string | null;
  created_at: string;
  exercise_type: string; 
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
  workout_type: string;
  priority: number;
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
  workout_type: string;
}

export interface WorkoutBasic {
  id: string;
  title: string;
  description?: string;
  day_of_week: number;
  week_id: string;
  priority?: number;
  week?: {
    week_number: number;
    program?: {
      id: string;
      title: string;
    }
  } | null;
  workout_exercises?: WorkoutExercise[];
  workout_type: string;
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
  title?: string; 
  workout_type?: string;
  // Add running-specific fields
  distance?: string;
  duration?: string;
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

// Add WorkoutSetCompletion interface
export interface WorkoutSetCompletion {
  id: string;
  workout_completion_id: string;
  workout_exercise_id: string;
  set_number: number;
  reps_completed?: number;
  weight?: number;
  completed: boolean;
  duration?: string;
  distance?: string;
  location?: string;
  notes?: string;
  created_at: string;
  user_id?: string;
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
  // Add the workout_set_completions property
  workout_set_completions?: WorkoutSetCompletion[];
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

// Standardized workout types
export const STANDARD_WORKOUT_TYPES = [
  'strength',
  'bodyweight',
  'cardio',
  'flexibility',
  'rest_day',
  'custom',
  'one_off'
] as const;

export type StandardWorkoutType = typeof STANDARD_WORKOUT_TYPES[number];

export interface ClientProfile {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  avatar_url: string | null;
  fitness_goals: string[];
  favorite_movements: string[];
  profile_completed: boolean;
  created_at?: string;
  updated_at?: string;
  event_type?: string | null;
  event_date?: string | null; 
  event_name?: string | null;
}
