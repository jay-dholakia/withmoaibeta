
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  coach_first_name?: string;
}

/**
 * Fetches the latest coach message for a client
 */
export const fetchLatestCoachMessage = async (clientId: string): Promise<CoachMessage | null> => {
  try {
    // First try using the RPC function
    const { data, error } = await supabase.rpc('get_latest_coach_message', {
      client_id_param: clientId
    });
    
    if (error) {
      console.error('Error fetching latest coach message:', error);
      
      // Fallback to direct query if RPC fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('week_of', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (fallbackError) {
        console.error('Fallback error fetching coach message:', fallbackError);
        return null;
      }
      
      return fallbackData && fallbackData.length > 0 ? fallbackData[0] : null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in fetchLatestCoachMessage:', error);
    return null;
  }
};

/**
 * Marks a message as read by the client
 */
export const markCoachMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('coach_messages')
      .update({ read_by_client: true })
      .eq('id', messageId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

// Add any additional coach message related functions here if needed
