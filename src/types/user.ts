
export interface User {
  id: string;
  email: string | null;
  metadata?: Record<string, any>;
}

export interface Profile {
  id: string;
  user_type: string;
  created_at: string;
  vacation_mode?: boolean;
}
