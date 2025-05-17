// Define the structure for a workout exercise
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps?: number;
  rest_time?: number;
  notes?: string;
  order: number;
  exercise?: Exercise;
}

// Define the structure for an exercise
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
  equipment?: string;
  muscle_group?: string;
}

// Define the structure for a workout
export interface Workout {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  user_id: string;
  workout_exercises?: WorkoutExercise[];
  workout_type?: string;
}

// Define the structure for a workout history item
export interface WorkoutHistoryItem {
  id: string;
  user_id: string;
  workout_id?: string;
  completed_at: string;
  notes?: string;
  rating?: number;
  workout?: Workout;
  life_happens_pass?: boolean;
  rest_day?: boolean;
  title?: string;
  description?: string;
  workout_type?: string;
  standalone_workout_id?: string;
}

// Add PersonalRecord type if it doesn't exist
export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps?: number;
  achieved_at: string;
  workout_completion_id?: string;
  exercise?: any;
}
