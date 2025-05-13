
import { supabase } from '@/integrations/supabase/client';
import { PersonalRecord } from '@/types/workout';

/**
 * Fetch personal records for a specific user
 */
export const fetchPersonalRecords = async (
  userId: string
): Promise<PersonalRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

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
