
// Re-export all client-related services for backward compatibility
export * from './profile';
export * from './avatar';
export * from './personal-records';
export * from './workout';
export * from './auth';
export * from './custom-workout/index';
export * from './workout-history';
export * from './chat';
export * from './clients';

// Export ClientProfile type for use in other files
import { ClientProfile } from './profile';
export type { ClientProfile };

// Fix for ProfileBuilder.tsx type error
export const createClientProfile = async (userId: string): Promise<Partial<ClientProfile> | null> => {
  // Import the implementation from the profile module to avoid circular dependencies
  const { createClientProfileImpl } = await import('./profile');
  return createClientProfileImpl(userId);
}
