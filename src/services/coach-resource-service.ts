
import { supabase } from '@/integrations/supabase/client';

export interface CoachResource {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

// Fetch coach resources for a specific coach
export const fetchCoachResources = async (coachId: string): Promise<CoachResource[]> => {
  const { data, error } = await supabase
    .from('coach_resources')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching coach resources:', error);
    throw error;
  }
  
  return data as CoachResource[];
};

// Add a new resource
export const addCoachResource = async (resource: Omit<CoachResource, 'id' | 'created_at' | 'updated_at'>) => {
  // Make sure empty strings are converted to null for URL field
  const resourceToAdd = {
    ...resource,
    url: resource.url && resource.url.trim() !== '' ? resource.url : null
  };
  
  const { data, error } = await supabase
    .from('coach_resources')
    .insert(resourceToAdd)
    .select()
    .single();
    
  if (error) {
    console.error('Error adding resource:', error);
    throw error;
  }
  
  return data as CoachResource;
};

// Update an existing resource
export const updateCoachResource = async (
  id: string, 
  coachId: string, 
  updates: Pick<CoachResource, 'title' | 'description' | 'url' | 'tags'>
) => {
  // Make sure empty strings are converted to null for URL field
  const updatesToApply = {
    ...updates,
    url: updates.url && updates.url.trim() !== '' ? updates.url : null
  };
  
  const { data, error } = await supabase
    .from('coach_resources')
    .update(updatesToApply)
    .eq('id', id)
    .eq('coach_id', coachId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
  
  return data as CoachResource;
};

// Delete a resource
export const deleteCoachResource = async (id: string, coachId: string) => {
  const { error } = await supabase
    .from('coach_resources')
    .delete()
    .eq('id', id)
    .eq('coach_id', coachId);
    
  if (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
  
  return true;
};
