
export interface User {
  id: string;
  email: string | null;
  metadata?: Record<string, any>;
  coach_id?: string;
}
