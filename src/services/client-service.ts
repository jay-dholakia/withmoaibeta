
/**
 * Client service methods for workout tracking and completion
 * This file now re-exports functionality from more specialized service files
 */

// Re-export from profile service
export {
  fetchClientProfile,
  createClientProfile,
  fetchAllClientProfiles,
  uploadClientAvatar,
  updateClientProfile,
  fetchCoachProfile,
  updateCoachProfile,
  uploadCoachAvatar
} from './profile-service';
export type { ClientProfile, CoachProfile } from './profile-service';

// Re-export from workout tracking service
export {
  trackWorkoutSet,
  completeWorkout,
  fetchPersonalRecords,
  submitBetaFeedback
} from './workout-tracking-service';

// Re-export from group service
export {
  fetchAllGroups,
  fetchGroupLeaderboardWeekly,
  fetchGroupLeaderboardMonthly
} from './group-service';
export type { GroupData, LeaderboardEntry } from './group-service';

// Re-export from auth service
export {
  sendPasswordResetEmail,
  deleteUser
} from './auth-service';
