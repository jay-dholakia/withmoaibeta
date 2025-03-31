
/**
 * Profile service for handling client and coach profile operations
 */

import { supabase } from "@/integrations/supabase/client";

// Type definitions
export interface ClientProfile {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  city?: string;
  state?: string;
  birthday?: string | null;
  height?: string;
  weight?: string;
  avatar_url?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  event_type?: string;
  event_date?: string;
  event_name?: string;
  profile_completed?: boolean;
}

export interface CoachProfile {
  id?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  favorite_movements?: string[];
}

/**
 * Fetches the client profile data
 */
export const fetchClientProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching client profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchClientProfile:", error);
    throw error;
  }
};

/**
 * Creates a client profile if it doesn't exist
 */
export const createClientProfile = async (userId: string) => {
  try {
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking client profile:", checkError);
      throw checkError;
    }
    
    if (existingProfile) {
      return existingProfile;
    }
    
    // Create new profile
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({
        id: userId,
        profile_completed: false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating client profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in createClientProfile:", error);
    throw error;
  }
};

/**
 * Fetches all client profiles
 */
export const fetchAllClientProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*');
    
    if (error) {
      console.error("Error fetching all client profiles:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchAllClientProfiles:", error);
    throw error;
  }
};

/**
 * Uploads a client avatar
 */
export const uploadClientAvatar = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('client-avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('client-avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading client avatar:", error);
    throw error;
  }
};

/**
 * Updates a client profile
 */
export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>) => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating client profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in updateClientProfile:", error);
    throw error;
  }
};

/**
 * Fetches the coach profile data
 */
export const fetchCoachProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching coach profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchCoachProfile:", error);
    throw error;
  }
};

/**
 * Updates a coach profile
 */
export const updateCoachProfile = async (userId: string, profileData: Partial<CoachProfile>) => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating coach profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in updateCoachProfile:", error);
    throw error;
  }
};

/**
 * Uploads a coach avatar
 */
export const uploadCoachAvatar = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('coach-avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('coach-avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading coach avatar:", error);
    throw error;
  }
};
