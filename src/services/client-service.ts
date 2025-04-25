
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/user';

export const fetchClientProfile = async (userId: string): Promise<Profile | null> => {
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
};
