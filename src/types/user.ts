
export interface User {
  id: string;
  email: string | null;
  metadata?: Record<string, any>;
  vacation_mode?: boolean;
}
