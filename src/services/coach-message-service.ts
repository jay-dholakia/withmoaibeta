import { supabase } from '@/integrations/supabase/client';

/**
 * Coach Message Type
 */
export interface CoachMessage {
  id: string;
  coach_id: string;
  client_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  week_of: string;
  read_by_client: boolean;
}

// Add any additional coach message related functions here if needed
