import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch personal records (with exercise details) for a user
 */
export const fetchPersonalRecords = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*, exercise:exercise_id(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching personal records:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchPersonalRecords:', error);
    return [];
  }
};
