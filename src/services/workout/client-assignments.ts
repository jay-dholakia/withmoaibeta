
import { supabase } from '@/integrations/supabase/client';

/**
 * Assigns a program to a user
 */
export const assignProgramToUser = async (data: {
  program_id: string;
  user_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string | null;
}) => {
  try {
    const { data: result, error } = await supabase
      .from('program_assignments')
      .insert([data])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error assigning program to user:', error);
    throw error;
  }
};

/**
 * Fetches assigned users for a program
 */
export const fetchAssignedUsers = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        id,
        user_id,
        program_id,
        start_date,
        end_date
      `)
      .eq('program_id', programId)
      .order('start_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching assigned users:', error);
    throw error;
  }
};

/**
 * Deletes a program assignment
 */
export const deleteProgramAssignment = async (assignmentId: string) => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting program assignment:', error);
    throw error;
  }
};

/**
 * Gets the count of assignments for each program
 */
export const getWorkoutProgramAssignmentCount = async (programIds: string[]): Promise<Record<string, number>> => {
  try {
    // For each program ID, perform a count query
    const countRecord: Record<string, number> = {};
    
    for (const programId of programIds) {
      const { data, error, count } = await supabase
        .from('program_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId);

      if (error) {
        console.error(`Error fetching count for program ${programId}:`, error);
        countRecord[programId] = 0;
      } else {
        // Use count which is provided by Supabase's count feature
        countRecord[programId] = count || 0;
      }
    }

    return countRecord;
  } catch (error) {
    console.error('Error fetching program assignment counts:', error);
    return {};
  }
};

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
