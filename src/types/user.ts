
export interface Profile {
  id: string;
  user_type: string;
  created_at: string;
  vacation_mode?: boolean; // Keep it optional with explicit boolean type
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  birthday?: string;
  height?: string;
  weight?: string;
  avatar_url?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  event_type?: string;
  event_date?: string;
  event_name?: string;
  profile_completed?: boolean;
}
