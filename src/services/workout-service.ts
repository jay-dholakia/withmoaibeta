
/**
 * Fetches all clients
 */
export const fetchAllClients = async () => {
  try {
    // First, get all client users
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_type', 'client');

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    // Get emails for these clients
    const userIds = data.map(client => client.id);
    const { data: emailData, error: emailError } = await supabase.rpc('get_users_email', {
      user_ids: userIds
    });

    if (emailError) {
      console.error('Error fetching client emails:', emailError);
    }

    // Get client profiles data
    const { data: profilesData, error: profilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching client profile data:', profilesError);
    }

    // Merge all data together
    const clientsWithEmail = data.map(client => {
      const emailInfo = emailData?.find(e => e.id === client.id);
      const profileData = profilesData?.find(p => p.id === client.id) || { first_name: null, last_name: null };
      
      return {
        id: client.id,
        email: emailInfo?.email || 'No email',
        user_type: client.user_type,
        first_name: profileData.first_name || null,
        last_name: profileData.last_name || null
      };
    });

    return clientsWithEmail;
  } catch (error) {
    console.error('Error in fetchAllClients:', error);
    throw error;
  }
};
