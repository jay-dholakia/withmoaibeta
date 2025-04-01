
/**
 * Complete a workout
 */
export const completeWorkout = async (
  workoutId: string,
  rating: number | null = null,
  notes: string | null = null
) => {
  try {
    const { data: existingCompletion, error: fetchError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('id', workoutId)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error checking workout completion:", fetchError);
    }
    
    const userId = await getUser().then(user => user?.id);
    
    if (existingCompletion) {
      const { data, error } = await supabase
        .from('workout_completions')
        .update({
          rating,
          notes,
          completed_at: new Date().toISOString(),
        })
        .eq('id', workoutId)
        .select()
        .single();
        
      if (error) {
        console.error("Error completing workout:", error);
        throw error;
      }
      
      return data;
    } else {
      const { data, error } = await supabase
        .from('workout_completions')
        .insert({
          workout_id: workoutId,
          user_id: userId,
          rating,
          notes,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error recording workout completion:", error);
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error in completeWorkout:", error);
    throw error;
  }
};
