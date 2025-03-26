import { supabase } from "@/integrations/supabase/client";
import { ProgramAssignment } from "@/types/workout";

/**
 * Fetches a workout program by ID.
 */
export const fetchWorkoutProgram = async (programId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .single();
    
    if (error) {
      console.error('Error fetching workout program:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching workout program:", error);
    return null;
  }
};

/**
 * Fetches all workout programs.
 */
export const fetchAllWorkoutPrograms = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*');
    
    if (error) {
      console.error('Error fetching all workout programs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching all workout programs:", error);
    return [];
  }
};

/**
 * Fetches all users assigned to a specific workout program.
 */
export const fetchAssignedUsers = async (programId: string): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('program_id', programId);
    
    if (error) {
      console.error('Error fetching assigned users:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    return [];
  }
};

/**
 * Assigns a workout program to a user.
 */
export const assignProgramToUser = async (assignmentData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .insert([assignmentData])
      .select()
      .single();
    
    if (error) {
      console.error('Error assigning program to user:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error assigning program to user:", error);
    throw error;
  }
};

/**
 * Fetches all clients.
 */
export const fetchAllClients = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'client');
    
    if (error) {
      console.error('Error fetching all clients:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching all clients:", error);
    return [];
  }
};

/**
 * Deletes a program assignment
 */
export const deleteProgramAssignment = async (assignmentId: string): Promise<boolean> => {
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
    console.error('Failed to delete program assignment:', error);
    return false;
  }
};
