
import { supabase } from "@/integrations/supabase/client";

export const createWorkoutWeek = async (data: {
  program_id: string;
  week_number: number;
  title: string;
  description: string | null;
}) => {
  const { data: week, error } = await supabase
    .from('workout_weeks')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating workout week:', error);
    throw error;
  }

  return week;
};

export const fetchWorkoutWeeks = async (programId: string) => {
  const { data: weeks, error } = await supabase
    .from('workout_weeks')
    .select('*')
    .eq('program_id', programId)
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching workout weeks:', error);
    throw error;
  }

  return weeks;
};

export const fetchWorkoutWeek = async (weekId: string) => {
  const { data: week, error } = await supabase
    .from('workout_weeks')
    .select('*, program:program_id (title, id)')
    .eq('id', weekId)
    .single();

  if (error) {
    console.error('Error fetching workout week:', error);
    throw error;
  }

  return week;
};

export const updateWorkoutWeek = async (weekId: string, data: {
  title?: string;
  description?: string | null;
  week_number?: number;
}) => {
  const { data: week, error } = await supabase
    .from('workout_weeks')
    .update(data)
    .eq('id', weekId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating workout week:', error);
    throw error;
  }

  return week;
};

export const deleteWorkoutWeek = async (weekId: string) => {
  const { error } = await supabase
    .from('workout_weeks')
    .delete()
    .eq('id', weekId);

  if (error) {
    console.error('Error deleting workout week:', error);
    throw error;
  }
};
