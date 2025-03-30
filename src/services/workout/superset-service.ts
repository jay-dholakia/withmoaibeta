
import { supabase } from "@/integrations/supabase/client";

export const createSupersetGroup = async (data: {
  workout_id: string;
  title?: string | null;
  description?: string | null;
}) => {
  const { data: supersetGroup, error } = await supabase
    .from('superset_groups')
    .insert({
      workout_id: data.workout_id,
      title: data.title,
      description: data.description
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating superset group:', error);
    throw error;
  }

  return supersetGroup;
};

export const fetchSupersetGroups = async (workoutId: string) => {
  const { data: supersetGroups, error } = await supabase
    .from('superset_groups')
    .select(`
      *,
      workout_exercises(*)
    `)
    .eq('workout_id', workoutId)
    .order('created_at');

  if (error) {
    console.error('Error fetching superset groups:', error);
    throw error;
  }

  return supersetGroups;
};

export const updateSupersetGroup = async (groupId: string, data: {
  title?: string | null;
  description?: string | null;
}) => {
  const { data: supersetGroup, error } = await supabase
    .from('superset_groups')
    .update(data)
    .eq('id', groupId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating superset group:', error);
    throw error;
  }

  return supersetGroup;
};

export const deleteSupersetGroup = async (groupId: string) => {
  const { error } = await supabase
    .from('superset_groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    console.error('Error deleting superset group:', error);
    throw error;
  }
};

export const addExerciseToSupersetGroup = async (exerciseId: string, groupId: string, orderIndex: number) => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .update({
      superset_group_id: groupId,
      superset_order: orderIndex
    })
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error adding exercise to superset group:', error);
    throw error;
  }

  return data;
};

export const removeExerciseFromSupersetGroup = async (exerciseId: string) => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .update({
      superset_group_id: null,
      superset_order: null
    })
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error removing exercise from superset group:', error);
    throw error;
  }

  return data;
};

export const updateExerciseSupersetOrder = async (exerciseId: string, newOrder: number) => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .update({
      superset_order: newOrder
    })
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating exercise superset order:', error);
    throw error;
  }

  return data;
};

// Standalone workout superset functions
export const createStandaloneSupersetGroup = async (data: {
  workout_id: string;
  title?: string | null;
  description?: string | null;
}) => {
  const { data: supersetGroup, error } = await supabase
    .from('standalone_superset_groups')
    .insert({
      workout_id: data.workout_id,
      title: data.title,
      description: data.description
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating standalone superset group:', error);
    throw error;
  }

  return supersetGroup;
};

export const fetchStandaloneSupersetGroups = async (workoutId: string) => {
  const { data: supersetGroups, error } = await supabase
    .from('standalone_superset_groups')
    .select(`
      *,
      standalone_workout_exercises(*)
    `)
    .eq('workout_id', workoutId)
    .order('created_at');

  if (error) {
    console.error('Error fetching standalone superset groups:', error);
    throw error;
  }

  return supersetGroups;
};

export const updateStandaloneSupersetGroup = async (groupId: string, data: {
  title?: string | null;
  description?: string | null;
}) => {
  const { data: supersetGroup, error } = await supabase
    .from('standalone_superset_groups')
    .update(data)
    .eq('id', groupId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating standalone superset group:', error);
    throw error;
  }

  return supersetGroup;
};

export const deleteStandaloneSupersetGroup = async (groupId: string) => {
  const { error } = await supabase
    .from('standalone_superset_groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    console.error('Error deleting standalone superset group:', error);
    throw error;
  }
};

export const addExerciseToStandaloneSupersetGroup = async (exerciseId: string, groupId: string, orderIndex: number) => {
  const { data, error } = await supabase
    .from('standalone_workout_exercises')
    .update({
      superset_group_id: groupId,
      superset_order: orderIndex
    })
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error adding exercise to standalone superset group:', error);
    throw error;
  }

  return data;
};

export const removeExerciseFromStandaloneSupersetGroup = async (exerciseId: string) => {
  const { data, error } = await supabase
    .from('standalone_workout_exercises')
    .update({
      superset_group_id: null,
      superset_order: null
    })
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error removing exercise from standalone superset group:', error);
    throw error;
  }

  return data;
};

export const updateExerciseStandaloneSupersetOrder = async (exerciseId: string, newOrder: number) => {
  const { data, error } = await supabase
    .from('standalone_workout_exercises')
    .update({
      superset_order: newOrder
    })
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating exercise standalone superset order:', error);
    throw error;
  }

  return data;
};
