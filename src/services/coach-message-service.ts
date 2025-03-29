
import { supabase } from '@/integrations/supabase/client';

export interface CoachMessage {
  id: string;
  coach_id: string;
  client_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  week_of: string;
  read_by_client: boolean;
  coach_first_name: string | null;
}

/**
 * Fetches the latest coach message for the current client
 */
export const fetchLatestCoachMessage = async (clientId: string): Promise<CoachMessage | null> => {
  if (!clientId) return null;
  
  try {
    const { data, error } = await supabase.rpc(
      'get_latest_coach_message',
      { client_id_param: clientId }
    );
    
    if (error) {
      console.error('Error fetching coach message:', error);
      return null;
    }
    
    if (!data || data.length === 0) return null;
    
    return data[0] as CoachMessage;
  } catch (error) {
    console.error('Error in fetchLatestCoachMessage:', error);
    return null;
  }
};

/**
 * Marks a coach message as read
 */
export const markCoachMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('coach_messages')
      .update({ read_by_client: true })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markCoachMessageAsRead:', error);
    return false;
  }
};
