import { supabase } from '@/integrations/supabase/client';

/**
 * Client Profile type definition
 */
export interface ClientProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  weight?: string;
  height?: string;
  birthday?: string | Date | null;
  city?: string;
  state?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  program_type?: string;
  event_type?: string;
  event_name?: string;
  event_date?: string | Date | null;
  avatar_url?: string;
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}


/** Fetch a single client profile by user ID */
export const fetchClientProfile = async (
  userId: string
): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchClientProfile:', error);
    return null;
  }
};

/** Create a client profile if not existing */
export const createClientProfile = async (
  userId: string
): Promise<ClientProfile | null> => {
  try {
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (existingProfile) return existingProfile;
    const { data, error } = await supabase
      .from('client_profiles')
      .insert([{ id: userId }])
      .select()
      .single();
    if (error) {
      console.error('Error creating client profile:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in createClientProfile:', error);
    return null;
  }
};

/** Update fields on an existing client profile */
export const updateClientProfile = async (
  userId: string,
  profileData: Partial<ClientProfile>
): Promise<ClientProfile | null> => {
  try {
    // Convert Date fields to ISO strings for DB
    type UpdatePayload = Partial<Omit<ClientProfile, 'birthday' | 'event_date'>> & {
      birthday?: string | null;
      event_date?: string | null;
    };
    const payload = { ...profileData } as UpdatePayload;

    if (profileData.birthday !== undefined) {
      const bd = profileData.birthday;
      payload.birthday = bd == null ? null : bd instanceof Date ? bd.toISOString() : bd;
    }
    if (profileData.event_date !== undefined) {
      const ev = profileData.event_date;
      payload.event_date = ev == null ? null : ev instanceof Date ? ev.toISOString() : ev;
    }

    const { data, error } = await supabase
      .from('client_profiles')
      .update<UpdatePayload>(payload)
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      console.error('Error updating client profile:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    return null;
  }
};

/** Fetch all client profiles */
export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  try {
    const { data, error } = await supabase.from('client_profiles').select('*');
    if (error) {
      console.error('Error fetching all client profiles:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in fetchAllClientProfiles:', error);
    return [];
  }
};
