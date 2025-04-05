
import { supabase } from '@/integrations/supabase/client';
import { logRunActivity, logCardioActivity } from '@/services/run-goals-service';

export interface OneOffWorkout {
  title: string;
  workout_type: string;
  description?: string;
  duration?: string;
  distance?: string;
  user_id: string;
}

export const saveOneOffWorkout = async (workoutData: OneOffWorkout) => {
  try {
    // First, save the workout completion record
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: workoutData.user_id,
        title: workoutData.title,
        description: workoutData.description,
        workout_type: workoutData.workout_type,
        duration: workoutData.duration,
        distance: workoutData.distance,
        completed_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    // For run workouts, also log to run_activities to track miles
    if (workoutData.workout_type === 'run' && workoutData.distance) {
      const distance = parseFloat(workoutData.distance);
      if (!isNaN(distance)) {
        await logRunActivity(
          workoutData.user_id,
          distance,
          'steady', // Default run type
          workoutData.description
        );
      }
    }

    // For cardio workouts, log to cardio_activities to track minutes
    if (workoutData.workout_type === 'cardio' && workoutData.duration) {
      const durationMatch = workoutData.duration.match(/(\d+)/);
      const minutes = durationMatch ? parseInt(durationMatch[1], 10) : 30; // Default to 30 minutes if parsing fails
      
      if (!isNaN(minutes)) {
        await logCardioActivity(
          workoutData.user_id,
          minutes,
          'general_cardio',
          workoutData.description
        );
      }
    }

    // For strength workouts, we'll count this as at least one exercise completed
    // The exercises count is tracked when workout sets are completed, so we don't need
    // special handling here beyond saving the workout completion

    return { data, error: null };
  } catch (error) {
    console.error('Error in saveOneOffWorkout:', error);
    return { data: null, error };
  }
};
