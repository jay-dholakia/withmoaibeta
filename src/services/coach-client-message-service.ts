
import { supabase } from '@/integrations/supabase/client';
import { CoachMessage } from './coach-message-service';

/**
 * Fetches all messages a coach has sent to a client
 */
export const fetchCoachMessagesForClient = async (coachId: string, clientId: string): Promise<CoachMessage[]> => {
  if (!coachId || !clientId) return [];
  
  try {
    const { data, error } = await supabase
      .from('coach_messages')
      .select(`
        *,
        coach_profiles(first_name)
      `)
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .order('week_of', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching coach messages for client:', error);
      return [];
    }
    
    return data.map(item => ({
      ...item,
      coach_first_name: item.coach_profiles?.first_name || null
    })) as CoachMessage[];
  } catch (error) {
    console.error('Error in fetchCoachMessagesForClient:', error);
    return [];
  }
};

/**
 * Creates or updates a coach message for a client
 */
export const saveCoachMessage = async (
  coachId: string, 
  clientId: string, 
  message: string, 
  weekOf: Date,
  existingMessageId?: string
): Promise<CoachMessage | null> => {
  try {
    // Format the date to YYYY-MM-DD
    const formattedWeekOf = weekOf.toISOString().split('T')[0];
    
    if (existingMessageId) {
      // Update existing message
      const { data, error } = await supabase
        .from('coach_messages')
        .update({
          message,
          week_of: formattedWeekOf,
          updated_at: new Date().toISOString(),
          read_by_client: false // Reset read status when updated
        })
        .eq('id', existingMessageId)
        .eq('coach_id', coachId) // Security check
        .select()
        .single();
      
      if (error) {
        console.error('Error updating coach message:', error);
        return null;
      }
      
      return data as CoachMessage;
    } else {
      // Create new message
      const { data, error } = await supabase
        .from('coach_messages')
        .insert({
          coach_id: coachId,
          client_id: clientId,
          message,
          week_of: formattedWeekOf
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating coach message:', error);
        return null;
      }
      
      return data as CoachMessage;
    }
  } catch (error) {
    console.error('Error in saveCoachMessage:', error);
    return null;
  }
};
