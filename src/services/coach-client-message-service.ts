
import { supabase } from '@/integrations/supabase/client';
import { CoachMessage } from './coach-message-service';

/**
 * Fetches all messages a coach has sent to a client
 */
export const fetchCoachMessagesForClient = async (coachId: string, clientId: string): Promise<CoachMessage[]> => {
  if (!coachId || !clientId) return [];
  
  try {
    console.log('Fetching messages for coach', coachId, 'and client', clientId);
    
    // First, fetch all coach messages
    const { data: messages, error } = await supabase
      .from('coach_messages')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .order('week_of', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching coach messages for client:', error);
      throw error;
    }
    
    // If we have messages, fetch the coach name separately
    if (messages && messages.length > 0) {
      // Get coach profile info for the coach ID
      const { data: coachProfile, error: coachError } = await supabase
        .from('coach_profiles')
        .select('first_name')
        .eq('id', coachId)
        .single();
      
      if (coachError) {
        console.error('Error fetching coach profile:', coachError);
      }
      
      // Combine the data
      return messages.map(message => ({
        ...message,
        coach_first_name: coachProfile?.first_name || null
      })) as CoachMessage[];
    }
    
    return [];
  } catch (error) {
    console.error('Error in fetchCoachMessagesForClient:', error);
    throw error;
  }
};

/**
 * Checks if a coach is allowed to send messages to a client
 */
export const canCoachMessageClient = async (coachId: string, clientId: string): Promise<boolean> => {
  try {
    console.log('Checking if coach', coachId, 'can message client', clientId);
    
    // Check if the client belongs to a group that the coach is assigned to
    const { data, error } = await supabase.rpc('is_coach_for_client', {
      coach_id: coachId,
      client_id: clientId
    });
    
    if (error) {
      console.error('Error checking coach-client relationship:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in canCoachMessageClient:', error);
    return false;
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
    console.log('Saving message for coach', coachId, 'and client', clientId);
    console.log('Message content:', message);
    console.log('Week of:', weekOf);
    console.log('Existing message ID:', existingMessageId);
    
    // First verify the coach can message this client
    const canMessage = await canCoachMessageClient(coachId, clientId);
    if (!canMessage) {
      console.error('Coach is not authorized to message this client');
      throw new Error('You are not authorized to send messages to this client');
    }
    
    // Format the date to YYYY-MM-DD
    const formattedWeekOf = weekOf.toISOString().split('T')[0];
    
    if (existingMessageId) {
      console.log('Updating existing message');
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
        throw error;
      }
      
      return data as CoachMessage;
    } else {
      console.log('Creating new message');
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
        throw error;
      }
      
      return data as CoachMessage;
    }
  } catch (error) {
    console.error('Error in saveCoachMessage:', error);
    throw error;
  }
};
