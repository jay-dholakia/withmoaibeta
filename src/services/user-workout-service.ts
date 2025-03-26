
import { getUserIdByEmail, getAssignedWorkoutsCountForWeek } from './workout-history-service';

interface WorkoutAssignmentInfo {
  userId: string | null;
  email: string;
  weekNumber: number;
  workoutsCount: number;
  error?: string;
}

/**
 * Gets information about how many workouts are assigned to a user for a specific week
 */
export const getWorkoutAssignmentInfoByEmail = async (
  email: string,
  weekNumber: number
): Promise<WorkoutAssignmentInfo> => {
  try {
    console.log(`Looking up workouts for ${email} in week ${weekNumber}`);
    
    // First, get the user ID from the email
    const userId = await getUserIdByEmail(email);
    
    if (!userId) {
      return {
        userId: null,
        email,
        weekNumber,
        workoutsCount: 0,
        error: 'User not found'
      };
    }
    
    console.log(`Found user ID: ${userId}`);
    
    // Then, get the workouts count for that user and week
    const workoutsCount = await getAssignedWorkoutsCountForWeek(userId, weekNumber);
    
    return {
      userId,
      email,
      weekNumber,
      workoutsCount
    };
  } catch (error) {
    console.error(`Error getting workout assignment info for ${email}:`, error);
    return {
      userId: null,
      email,
      weekNumber,
      workoutsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
