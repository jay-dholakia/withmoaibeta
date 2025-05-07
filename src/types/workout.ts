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
}
