
export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  workout_completion_id?: string;
  created_at: string;
  exercise?: {
    id: string;
    name: string;
    category: string;
  };
  exercise_name?: string;
  achieved_at?: string; // Added for compatibility with responses
}

// Define missing workout-related types
export interface Exercise {
  id: string;
  name: string;
  category: string;
  exercise_type?: string;
  description?: string;
  youtube_link?: string;
  muscle_group?: string;
  log_type?: string;
  created_at?: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
  superset_group_id?: string;
  superset_order?: number;
  created_at?: string;
  exercise?: Exercise;
}

export interface WorkoutHistoryItem {
  id: string;
  user_id: string;
  workout_id?: string;
  started_at: string;
  completed_at?: string;
  title?: string;
  description?: string;
  workout_type?: string;
  life_happens_pass?: boolean;
  standalone_workout_id?: string;
  custom_workout_id?: string;
  rest_day?: boolean;
  duration?: string;
  distance?: string;
  location?: string;
  notes?: string;
  rating?: number;
}

export interface WorkoutSetCompletion {
  id: string;
  workout_completion_id: string;
  workout_exercise_id: string;
  set_number: number;
  weight?: number;
  reps_completed?: number;
  completed: boolean;
  notes?: string;
  created_at: string;
  user_id: string;
  distance?: string;
  duration?: string;
  location?: string;
}

export interface Workout {
  id: string;
  title: string;
  description?: string;
  day_of_week: number;
  week_id: string;
  workout_type?: 'strength' | 'cardio' | 'mobility' | 'flexibility';
  priority?: number;
  template_id?: string;
  created_at?: string;
  workout_exercises?: WorkoutExercise[];
}

export interface WorkoutWeek {
  id: string;
  title: string;
  description?: string;
  week_number: number;
  program_id: string;
  target_strength_workouts?: number;
  target_cardio_minutes?: number;
  target_miles_run?: number;
  target_strength_mobility_workouts?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  description?: string;
  weeks: number;
  coach_id: string;
  program_type: string;
  created_at?: string;
  updated_at?: string;
}

export interface StandaloneWorkout {
  id: string;
  title: string;
  description?: string;
  coach_id: string;
  workout_type?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
  standalone_workout_exercises?: WorkoutExercise[];
}

export type StandardWorkoutType = 'strength' | 'cardio' | 'mobility' | 'flexibility';

export const STANDARD_WORKOUT_TYPES: StandardWorkoutType[] = [
  'strength',
  'cardio',
  'mobility',
  'flexibility'
];

export const DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 7];
