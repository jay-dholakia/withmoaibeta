
import { supabase } from "@/integrations/supabase/client";
import { WorkoutProgram } from "@/types/workout";

export const createWorkoutProgram = async (data: {
  title: string;
  description: string | null;
  weeks: number;
  coach_id: string;
}) => {
  const { data: program, error } = await supabase
    .from('workout_programs')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating workout program:', error);
    throw error;
  }

  return program;
};

export const fetchWorkoutPrograms = async (coachId: string) => {
  const { data: programs, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workout programs:', error);
    throw error;
  }

  return programs;
};

export const fetchWorkoutProgram = async (programId: string): Promise<WorkoutProgram> => {
  const { data: program, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (error) {
    console.error('Error fetching workout program:', error);
    throw error;
  }

  return program;
};

export const updateWorkoutProgram = async (programId: string, data: {
  title?: string;
  description?: string | null;
  weeks?: number;
}) => {
  const { data: program, error } = await supabase
    .from('workout_programs')
    .update(data)
    .eq('id', programId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating workout program:', error);
    throw error;
  }

  return program;
};

export const deleteWorkoutProgram = async (programId: string) => {
  const { error } = await supabase
    .from('workout_programs')
    .delete()
    .eq('id', programId);

  if (error) {
    console.error('Error deleting workout program:', error);
    throw error;
  }
};

export const getWorkoutProgramAssignmentCount = async (programId: string) => {
  const { count, error } = await supabase
    .from('program_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId);

  if (error) {
    console.error('Error getting workout program assignment count:', error);
    throw error;
  }

  return count || 0;
};

export const fetchAssignedUsers = async (programId: string) => {
  const { data: assignments, error } = await supabase
    .from('program_assignments')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assigned users:', error);
    throw error;
  }

  return assignments;
};

export const assignProgramToUser = async (data: {
  program_id: string;
  user_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string | null;
}) => {
  const { data: assignment, error } = await supabase
    .from('program_assignments')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error assigning program to user:', error);
    throw error;
  }

  return assignment;
};

export const deleteProgramAssignment = async (assignmentId: string) => {
  const { error } = await supabase
    .from('program_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    console.error('Error deleting program assignment:', error);
    throw error;
  }

  return true;
};
