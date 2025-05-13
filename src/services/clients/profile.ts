
import { supabase } from "@/integrations/supabase/client";

// Define the ClientProfile type
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

export const fetchClientProfile = async (userId: string): Promise<Partial<ClientProfile>> => {
  if (!userId) {
    console.error('fetchClientProfile: No user ID provided');
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching client profile:', error);
      throw error;
    }

    return data as ClientProfile;
  } catch (error) {
    console.error('Error in fetchClientProfile:', error);
    throw error;
  }
};

export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<Partial<ClientProfile>> => {
  if (!userId) {
    console.error('updateClientProfile: No user ID provided');
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(profileData)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating client profile:', error);
      throw error;
    }

    return data as ClientProfile;
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    throw error;
  }
};

// Implementation of createClientProfile function that can be imported elsewhere
export const createClientProfileImpl = async (userId: string): Promise<Partial<ClientProfile> | null> => {
  if (!userId) {
    console.error('createClientProfile: No user ID provided');
    return null;
  }

  try {
    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return fetchClientProfile(userId);
    }

    // Create new profile with minimal data
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
      throw error;
    }

    console.log('New client profile created:', data);
    return data as ClientProfile;
  } catch (error) {
    console.error('Error in createClientProfile:', error);
    throw error;
  }
};

export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*');

    if (error) {
      console.error('Error fetching all client profiles:', error);
      throw error;
    }

    return data as ClientProfile[];
  } catch (error) {
    console.error('Error in fetchAllClientProfiles:', error);
    throw error;
  }
};
