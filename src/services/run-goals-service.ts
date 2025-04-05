import { supabase } from "@/integrations/supabase/client";

export const logRunActivity = async (
  userId: string, 
  distance: number, 
  runType: 'steady' | 'tempo' | 'long' | 'speed' | 'hill', 
  notes?: string,
  completedAt: Date = new Date()
): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from('run_activities')
      .insert({
        user_id: userId,
        distance,
        run_type: runType,
        notes,
        completed_at: completedAt.toISOString()
      });
      
    if (error) {
      console.error('Error logging run activity:', error);
      return { success: false };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Exception logging run activity:', err);
    return { success: false };
  }
};

export const logCardioActivity = async (
  userId: string,
  minutes: number,
  activityType: string,
  notes?: string,
  completedAt: Date = new Date()
): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from('cardio_activities')
      .insert({
        user_id: userId,
        minutes,
        activity_type: activityType,
        notes,
        completed_at: completedAt.toISOString()
      });
      
    if (error) {
      console.error('Error logging cardio activity:', error);
      return { success: false };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Exception logging cardio activity:', err);
    return { success: false };
  }
};
