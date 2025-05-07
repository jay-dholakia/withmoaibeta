
/**
 * Fetch personal records
 */
export const fetchPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercises(name, category)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching personal records:", error);
    throw error;
  }

  // Log the raw data for debugging
  console.log("Raw personal records data from DB:", data);

  return data.map(record => ({
    ...record,
    exercise_name: record.exercise?.name
  })) as PersonalRecord[];
};

/**
 * Fetch personal record for a specific exercise
 */
export const fetchExercisePersonalRecord = async (userId: string, exerciseId: string): Promise<PersonalRecord | null> => {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercises(name, category)
    `)
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching personal record for exercise ${exerciseId}:`, error);
    throw error;
  }

  if (!data) return null;
  
  return {
    ...data,
    exercise_name: data.exercise?.name
  } as PersonalRecord;
};
