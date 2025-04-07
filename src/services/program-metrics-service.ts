
import { supabase } from "@/integrations/supabase/client";

interface UpdateWeeklyMetricsParams {
  programId: string;
  weekNumber: number;
  metrics: {
    targetStrengthWorkouts?: number;
    targetStrengthMobilityWorkouts?: number;
    targetMilesRun?: number;
    targetCardioMinutes?: number;
  };
}

/**
 * Updates the weekly metrics for a program week
 */
export const updateWeeklyMetrics = async ({
  programId,
  weekNumber,
  metrics
}: UpdateWeeklyMetricsParams): Promise<any> => {
  try {
    const payload = {
      program_id: programId,
      week_number: weekNumber,
      metrics: {
        target_strength_workouts: metrics.targetStrengthWorkouts,
        target_strength_mobility_workouts: metrics.targetStrengthMobilityWorkouts,
        target_miles_run: metrics.targetMilesRun,
        target_cardio_minutes: metrics.targetCardioMinutes
      }
    };

    const { data, error } = await supabase.functions.invoke('update_weekly_metrics', {
      method: 'POST',
      body: payload,
    });

    if (error) {
      console.error("Error updating weekly metrics:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to update weekly metrics:", error);
    throw error;
  }
};
