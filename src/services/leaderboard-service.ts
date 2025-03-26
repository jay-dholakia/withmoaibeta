
import { getWorkoutAssignmentInfoByEmail } from './user-workout-service';

/**
 * Gets the number of workouts assigned to a user for a specific week
 */
export const getWorkoutsForUserEmail = async (email: string, weekNumber: number) => {
  try {
    const result = await getWorkoutAssignmentInfoByEmail(email, weekNumber);
    return {
      email: result.email,
      weekNumber: result.weekNumber,
      workoutsCount: result.workoutsCount,
      userId: result.userId,
      error: result.error
    };
  } catch (error) {
    console.error(`Error getting workouts for ${email}:`, error);
    return {
      email,
      weekNumber,
      workoutsCount: 0,
      userId: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
