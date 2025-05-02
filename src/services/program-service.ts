
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all workout programs
 */
export const fetchWorkoutPrograms = async () => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching workout programs:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchWorkoutPrograms:', error);
    throw error;
  }
};

/**
 * Fetch a specific workout program by ID
 */
export const fetchWorkoutProgram = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .single();
      
    if (error) {
      console.error('Error fetching workout program:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchWorkoutProgram:', error);
    throw error;
  }
};

/**
 * Create a new workout program
 */
export const createWorkoutProgram = async (data: {
  title: string;
  weeks: number;
  description?: string | null;
  coach_id: string;
  program_type?: string;
}) => {
  try {
    const { data: program, error } = await supabase
      .from('workout_programs')
      .insert({
        title: data.title,
        weeks: data.weeks,
        description: data.description || null,
        coach_id: data.coach_id,
        program_type: data.program_type || 'strength'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating workout program:', error);
      throw error;
    }
    
    return program;
  } catch (error) {
    console.error('Error in createWorkoutProgram:', error);
    throw error;
  }
};

/**
 * Update a workout program
 */
export const updateWorkoutProgram = async (programId: string, data: {
  title?: string;
  weeks?: number;
  description?: string | null;
  program_type?: string;
}) => {
  try {
    const { data: program, error } = await supabase
      .from('workout_programs')
      .update({
        title: data.title,
        weeks: data.weeks,
        description: data.description,
        program_type: data.program_type
      })
      .eq('id', programId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating workout program:', error);
      throw error;
    }
    
    return program;
  } catch (error) {
    console.error('Error in updateWorkoutProgram:', error);
    throw error;
  }
};

/**
 * Delete a workout program
 */
export const deleteWorkoutProgram = async (programId: string) => {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', programId);
      
    if (error) {
      console.error('Error deleting workout program:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteWorkoutProgram:', error);
    throw error;
  }
};

/**
 * Fetch all workout program weeks
 */
export const fetchWorkoutWeeks = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select(`
        *,
        program:program_id (
          title,
          id,
          program_type
        )
      `)
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
      
    if (error) {
      console.error('Error fetching workout weeks:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchWorkoutWeeks:', error);
    throw error;
  }
};

/**
 * Get program assignment count
 */
export const getWorkoutProgramAssignmentCount = async (programIds: string[]) => {
  if (!programIds || programIds.length === 0) {
    return {};
  }
  
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('program_id')
      .in('program_id', programIds)
      .is('end_date', null);
      
    if (error) {
      console.error('Error fetching program assignments:', error);
      throw error;
    }
    
    // Count assignments per program
    const counts: Record<string, number> = {};
    
    programIds.forEach(id => {
      counts[id] = 0;
    });
    
    if (data) {
      data.forEach(assignment => {
        if (counts[assignment.program_id] !== undefined) {
          counts[assignment.program_id]++;
        }
      });
    }
    
    return counts;
  } catch (error) {
    console.error('Error in getWorkoutProgramAssignmentCount:', error);
    return {};
  }
};

/**
 * Assign a program to a user
 */
export const assignProgramToUser = async (data: {
  program_id: string;
  user_id: string;
  assigned_by: string;
  start_date: string;
}) => {
  try {
    // First check if there's an existing assignment for this user
    const { data: existingAssignments, error: fetchError } = await supabase
      .from('program_assignments')
      .select('id')
      .eq('user_id', data.user_id)
      .is('end_date', null);
      
    if (fetchError) {
      console.error('Error checking existing assignments:', fetchError);
      throw fetchError;
    }
    
    // If existing assignments, update them to set end_date
    if (existingAssignments && existingAssignments.length > 0) {
      const { error: updateError } = await supabase
        .from('program_assignments')
        .update({ end_date: new Date().toISOString().split('T')[0] })
        .eq('user_id', data.user_id)
        .is('end_date', null);
        
      if (updateError) {
        console.error('Error updating existing assignments:', updateError);
        throw updateError;
      }
    }
    
    // Create the new assignment
    const { data: assignment, error } = await supabase
      .from('program_assignments')
      .insert({
        program_id: data.program_id,
        user_id: data.user_id,
        assigned_by: data.assigned_by,
        start_date: data.start_date,
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error assigning program:', error);
      throw error;
    }
    
    return assignment;
  } catch (error) {
    console.error('Error in assignProgramToUser:', error);
    throw error;
  }
};

/**
 * Fetch users assigned to a program
 */
export const fetchAssignedUsers = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        *,
        user:user_id (
          email,
          id
        )
      `)
      .eq('program_id', programId)
      .is('end_date', null);
      
    if (error) {
      console.error('Error fetching assigned users:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchAssignedUsers:', error);
    throw error;
  }
};

/**
 * Delete a program assignment
 */
export const deleteProgramAssignment = async (assignmentId: string) => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .delete()
      .eq('id', assignmentId);
      
    if (error) {
      console.error('Error deleting program assignment:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteProgramAssignment:', error);
    throw error;
  }
};

/**
 * Fetch all clients
 */
export const fetchAllClients = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        user_type,
        client:id (
          first_name,
          last_name
        )
      `)
      .eq('user_type', 'client');
      
    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
    
    // Get emails for clients
    const userIds = data.map(profile => profile.id);
    
    if (userIds.length === 0) {
      return [];
    }
    
    const { data: userData, error: userError } = await supabase.rpc(
      'get_users_email',
      { user_ids: userIds }
    );
    
    if (userError) {
      console.error('Error fetching user emails:', userError);
      throw userError;
    }
    
    // Merge data
    const clients = data.map(profile => {
      const user = userData.find(u => u.id === profile.id);
      
      return {
        id: profile.id,
        email: user?.email || '',
        first_name: profile.client?.first_name || '',
        last_name: profile.client?.last_name || '',
        user_type: profile.user_type
      };
    });
    
    return clients;
  } catch (error) {
    console.error('Error in fetchAllClients:', error);
    throw error;
  }
};

/**
 * Fetch client's program assignments
 */
export const fetchClientPrograms = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        *,
        program:program_id (
          id,
          title,
          description,
          weeks,
          program_type
        )
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
      
    if (error) {
      console.error('Error fetching client programs:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchClientPrograms:', error);
    throw error;
  }
};

/**
 * Fetch a user's current assigned program
 */
export const fetchCurrentProgram = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        *,
        program:program_id (
          id,
          title,
          description,
          weeks,
          program_type
        )
      `)
      .eq('user_id', userId)
      .is('end_date', null)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No current program assigned
        return null;
      }
      console.error('Error fetching current program:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchCurrentProgram:', error);
    // Return null instead of throwing, since not having a program is a valid state
    return null;
  }
};
