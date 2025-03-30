import { supabase } from "@/integrations/supabase/client";
import { fetchCurrentProgram } from "./program-service";
import { startOfWeek, endOfWeek, format } from "date-fns";

/**
 * Gets the weekly assigned workouts count for a user
 */
export const getWeeklyAssignedWorkoutsCount = async (userId: string): Promise<number> => {
  try {
    console.log("Getting weekly assigned workouts count for user:", userId);
    
    // Fetch the user's current program
    const currentProgram = await fetchCurrentProgram(userId);
    
    if (!currentProgram || !currentProgram.program) {
      console.error("No current program found for user");
      throw new Error("No program assigned");
    }
    
    // Calculate the current week within the program
    const startDate = new Date(currentProgram.start_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.floor(diffDays / 7) + 1;
    
    console.log(`Current week in program: ${currentWeekNumber}`);
    
    // Find the corresponding week in the program
    const weeks = currentProgram.program.weekData || [];
    const currentWeek = weeks.find(week => week.week_number === currentWeekNumber);
    
    if (!currentWeek) {
      console.error(`Week ${currentWeekNumber} not found in program`);
      throw new Error("Current week not found in program");
    }
    
    // Count the number of workouts in this week
    const workoutsCount = currentWeek.workouts ? currentWeek.workouts.length : 0;
    
    console.log(`Found ${workoutsCount} workouts assigned for week ${currentWeekNumber}`);
    
    return workoutsCount;
  } catch (error) {
    console.error("Error getting weekly assigned workouts count:", error);
    throw error;
  }
};

/**
 * Counts the completed workouts for a user within a given week
 */
export const countCompletedWorkoutsForWeek = async (userId: string, weekStart: Date): Promise<number> => {
  try {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const { data, error } = await supabase
      .from('workout_completions')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', format(weekStart, 'yyyy-MM-dd'))
      .lte('completed_at', format(weekEnd, 'yyyy-MM-dd'));
    
    if (error) {
      console.error("Error fetching completed workouts:", error);
      return 0;
    }
    
    return data ? data.length : 0;
  } catch (error) {
    console.error("Error counting completed workouts:", error);
    return 0;
  }
};
