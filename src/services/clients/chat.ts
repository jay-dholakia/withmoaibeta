
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "@/services/coach-clients-service";

/**
 * Fetch all clients available for a coach to message
 */
export const fetchClientsForChat = async (coachId: string): Promise<ClientData[]> => {
  if (!coachId) return [];

  try {
    // First get all groups the coach is assigned to
    const { data: coachGroups, error: groupError } = await supabase
      .from('group_coaches')
      .select('group_id')
      .eq('coach_id', coachId);

    if (groupError) {
      console.error('Error fetching coach groups:', groupError);
      return [];
    }

    if (!coachGroups || coachGroups.length === 0) {
      return [];
    }

    // Extract group IDs
    const groupIds = coachGroups.map(group => group.group_id);

    // Get all clients in these groups
    const { data: clients, error: clientsError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        profiles:user_id (user_type),
        client_profiles:user_id (first_name, last_name, avatar_url)
      `)
      .in('group_id', groupIds)
      .eq('profiles.user_type', 'client');

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return [];
    }

    // Transform to ClientData format
    const clientsData: ClientData[] = clients.map(client => ({
      id: client.user_id,
      user_type: 'client',
      first_name: client.client_profiles?.first_name || null,
      last_name: client.client_profiles?.last_name || null,
      avatar_url: client.client_profiles?.avatar_url || null,
      email: null, // We'll get emails in a separate query
      last_workout_at: null,
      total_workouts_completed: 0,
      current_program_id: null,
      current_program_title: null,
      days_since_last_workout: null,
      group_ids: []
    }));

    // If we have clients, get their emails
    if (clientsData.length > 0) {
      const clientIds = clientsData.map(client => client.id);
      
      const { data: emails, error: emailsError } = await supabase
        .rpc('get_users_email', { user_ids: clientIds });
      
      if (emailsError) {
        console.error('Error fetching emails:', emailsError);
      } else if (emails) {
        // Create email map
        const emailMap: Record<string, string> = {};
        emails.forEach((item: { id: string, email: string }) => {
          emailMap[item.id] = item.email;
        });
        
        // Add emails to client data
        clientsData.forEach(client => {
          client.email = emailMap[client.id] || null;
        });
      }
    }

    return clientsData;
  } catch (error) {
    console.error('Error fetching clients for chat:', error);
    return [];
  }
};
