
import { supabase } from "@/integrations/supabase/client";

// Define ClientProfile interface
export interface ClientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  avatar_url: string | null;
  fitness_goals: string[] | null;
  favorite_movements: string[] | null;
  event_type: string | null;
  event_date: string | null;
  event_name: string | null;
  profile_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches a client profile by user ID
 */
export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const result = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name, city, state, birthday, height, weight, avatar_url, fitness_goals, favorite_movements, event_type, event_date, event_name, profile_completed, created_at, updated_at')
      .eq('id', userId)
      .single();

    const data = result.data as ClientProfile | null;
    const error = result.error;

    if (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return null;
  }
};

/**
 * Creates a new client profile for a user - implementation function
 * Used internally by the exported function to avoid circular dependencies
 */
export const createClientProfileImpl = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return fetchClientProfile(userId);
    }

    const profileData = {
      id: userId,
      profile_completed: false,
    };

    const { data, error } = await supabase
      .from('client_profiles')
      .insert([profileData])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating client profile:', error);
      return null;
    }

    console.log('New client profile created:', data);
    return data as ClientProfile;
  } catch (error) {
    console.error('Error creating client profile:', error);
    return null;
  }
};

/**
 * Updates a client profile
 */
export const updateClientProfile = async (userId: string, updates: Partial<ClientProfile>): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('id', userId) // Changed from 'user_id' to 'id' to match the schema
      .select()
      .single();

    if (error) {
      console.error('Error updating client profile:', error);
      return null;
    }

    return data as ClientProfile;
  } catch (error) {
    console.error('Error updating client profile:', error);
    return null;
  }
};

/**
 * Fetch all client profiles (for admin use)
 */
export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*');

    if (error) {
      console.error('Error fetching all client profiles:', error);
      return [];
    }

    return data as ClientProfile[];
  } catch (error) {
    console.error('Error in fetchAllClientProfiles:', error);
    return [];
  }
};
