export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string | null;
  created_at?: string;
  exercise_type: string; 
  youtube_link?: string;
  muscle_group: string | null;
  log_type?: string;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  description: string | null;
  weeks: number;
  coach_id: string;
  created_at: string;
  updated_at: string;
  program_type: string;
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
    program_type?: string;
  } | null;
  workouts?: Workout[];
}

export interface Workout {
  id: string;
  week_id: string;
  title: string;
  description: string | null;
  created_at: string;
  workout_exercises?: WorkoutExercise[];
  workout_type: string;
  priority: number;
  template_id?: string | null;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps?: number;
  achieved_at: string;
  workout_completion_id?: string;
  exercise_name?: string;
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
  week_id: string;
  priority?: number;
  week?: {
    week_number: number;
    program?: {
      id: string;
      title: string;
      program_type?: string;
    }
  } | null;
  workout_exercises?: WorkoutExercise[];
  workout_type: string;
  custom_workout?: boolean;
  template_id?: string | null;
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
  exercise?: Exercise;
  workout?: Workout;
  title?: string;
  workout_type?: string;
  distance?: string;
  duration?: string;
  location?: string;
  completed_date?: string;
  superset_group_id?: string | null;
  superset_order?: number | null;
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
  completed_date?: string;
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
  workout_set_completions?: WorkoutSetCompletion[];
  custom_workout_id?: string;
  title?: string;
  description?: string;
  workout_type?: string;
  duration?: string;
  distance?: string;
  location?: string;
  completed_date?: string;
}

export interface WorkoutActivityType {
  id: string;
  type: StandardWorkoutType;
  title: string; 
  description?: string;
  date: Date;
  notes?: string;
  distance?: string;
  duration?: string;
  location?: string;
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

export const STANDARD_WORKOUT_TYPES = [
  'strength',
  'bodyweight',
  'cardio',
  'flexibility',
  'rest_day',
  'custom',
  'one_off',
  'hiit',
  'sport',
  'swimming',
  'cycling',
  'dance',
  'basketball',
  'golf',
  'volleyball',
  'baseball',
  'tennis',
  'hiking',
  'skiing',
  'yoga',
  'running',
  'live_run',
  'mobility'
] as const;

export type StandardWorkoutType = typeof STANDARD_WORKOUT_TYPES[number];

export const PROGRAM_TYPES = ['strength', 'run'] as const;
export type ProgramType = typeof PROGRAM_TYPES[number];

// Define a type for workout types specifically used in workout forms
export type WorkoutFormType = "strength" | "cardio" | "flexibility" | "mobility" | StandardWorkoutType;

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
