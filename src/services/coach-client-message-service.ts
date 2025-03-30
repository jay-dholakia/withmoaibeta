
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Fetches all coach messages for a specific client
 */
export const fetchCoachMessagesForClient = async (coachId: string, clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('coach_messages')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .order('week_of', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching coach messages:', error);
    toast.error('Failed to load messages');
    return [];
  }
};

/**
 * Checks if a coach is allowed to message a specific client
 * This checks if the client is in any of the coach's groups
 */
export const canCoachMessageClient = async (coachId: string, clientId: string): Promise<boolean> => {
  try {
    // Check if client is in any of coach's groups using the is_coach_for_client RPC
    const { data, error } = await supabase.rpc('is_coach_for_client', {
      coach_id: coachId,
      client_id: clientId
    });
    
    if (error) {
      console.error('Error checking coach permission:', error);
      
      // Fallback to direct query if RPC fails
      const { data: groupsData, error: groupsError } = await supabase
        .from('group_coaches')
        .select('group_id')
        .eq('coach_id', coachId);
        
      if (groupsError) {
        console.error('Error fetching coach groups:', groupsError);
        return false;
      }
      
      if (!groupsData || groupsData.length === 0) return false;
      
      const groupIds = groupsData.map(g => g.group_id);
      
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('user_id', clientId)
        .in('group_id', groupIds);
        
      if (membersError) {
        console.error('Error checking client membership:', membersError);
        return false;
      }
      
      return membersData && membersData.length > 0;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in canCoachMessageClient:', error);
    return false;
  }
};

/**
 * Saves a coach message for a client
 */
export const saveCoachMessage = async (
  coachId: string, 
  clientId: string, 
  message: string,
  weekOf: string | Date,
  messageId?: string
) => {
  try {
    // Convert Date object to ISO string if needed
    const weekOfString = weekOf instanceof Date ? weekOf.toISOString() : weekOf;
    
    // If messageId is provided, update existing message
    if (messageId) {
      const { data, error } = await supabase
        .from('coach_messages')
        .update({
          message,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('coach_id', coachId) // Safety check
        .select();
        
      if (error) throw error;
      return data[0];
    }
    // Otherwise create a new message
    else {
      const { data, error } = await supabase
        .from('coach_messages')
        .insert({
          coach_id: coachId,
          client_id: clientId,
          message,
          week_of: weekOfString
        })
        .select();
        
      if (error) throw error;
      return data[0];
    }
  } catch (error) {
    console.error('Error saving coach message:', error);
    toast.error('Failed to save message');
    throw error;
  }
};

/**
 * Marks a message as read by the client
 */
export const markMessageAsRead = async (messageId: string) => {
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
