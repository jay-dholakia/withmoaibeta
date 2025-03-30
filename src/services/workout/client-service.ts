
import { supabase } from "@/integrations/supabase/client";

export const fetchAllClients = async () => {
  try {
    // First fetch basic profile information
    const { data: clients, error } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_type', 'client');

    if (error) {
      console.error('Error fetching all clients:', error);
      throw error;
    }

    // If no clients found, return empty array
    if (!clients || clients.length === 0) {
      return [];
    }

    // Get emails and additional profile data
    if (clients.length > 0) {
      const userIds = clients.map(client => client.id);
      
      // Fetch emails
      const { data: userData, error: userError } = await supabase.rpc('get_users_email', {
        user_ids: userIds
      });

      if (userError) {
        console.error('Error fetching user emails:', userError);
        throw userError;
      }

      // Fetch client profile data (first_name, last_name)
      const { data: profileData, error: profileError } = await supabase
        .from('client_profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching client profiles:', profileError);
        throw profileError;
      }

      // Combine the data
      const clientsWithDetails = clients.map(client => {
        const userInfo = userData?.find(u => u.id === client.id);
        const profileInfo = profileData?.find(p => p.id === client.id);
        
        return {
          id: client.id,
          user_type: client.user_type,
          email: userInfo?.email || 'N/A',
          first_name: profileInfo?.first_name || null,
          last_name: profileInfo?.last_name || null
        };
      });

      return clientsWithDetails;
    }

    return clients;
  } catch (error) {
    console.error('Error fetching all clients:', error);
    throw error;
  }
};
