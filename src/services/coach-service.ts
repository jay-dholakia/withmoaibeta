
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all groups a coach is assigned to
 */
export const fetchCoachGroups = async (coachId: string) => {
  if (!coachId) throw new Error('Coach ID is required');
  
  console.log('Service: Fetching coach groups for coach ID:', coachId);
  
  // Get groups the coach is assigned to
  const { data: groupCoaches, error: groupCoachesError } = await supabase
    .from('group_coaches')
    .select('group_id, id, coach_id')  // Added more fields for better debugging
    .eq('coach_id', coachId);
    
  if (groupCoachesError) {
    console.error('Service: Error fetching group_coaches:', groupCoachesError);
    throw groupCoachesError;
  }
  
  console.log('Service: Group coaches data:', groupCoaches);
  
  if (!groupCoaches || groupCoaches.length === 0) {
    console.log('Service: No groups found for coach');
    
    // Additional debugging: log the specific coach ID we're using and its format
    console.log('Service: Coach ID format check:', {
      original: coachId,
      lowercase: coachId.toLowerCase(),
      noHyphens: coachId.replace(/-/g, ''),
      length: coachId.length
    });
    
    return [];
  }
  
  // Get the actual group details
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupCoaches.map(gc => gc.group_id));
    
  if (groupsError) {
    console.error('Service: Error fetching groups:', groupsError);
    throw groupsError;
  }
  
  console.log('Service: Groups data:', groups);
  return groups || [];
};

/**
 * Fetches all clients associated with the coach's groups
 */
export const fetchCoachClients = async (coachId: string) => {
  if (!coachId) throw new Error('Coach ID is required');
  
  try {
    const { data, error } = await supabase.rpc('get_coach_clients', {
      coach_id: coachId
    });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching coach clients:', error);
    throw error;
  }
};
