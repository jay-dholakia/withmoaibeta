
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
  weeks: number;
  coach_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutWeek {
  id: string;
  program_id: string;
  week_number: number;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  week_id: string;
  day_of_week: number;
  title: string;
  description: string | null;
  created_at: string;
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

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday', 
  'Saturday'
];
