
// Re-export all client-related services for backward compatibility
export * from './profile';
export * from './avatar';
export * from './personal-records';
export * from './workout';
export * from './auth';

// Export ClientProfile type for use in other files
import type { ClientProfile } from './profile';
export type { ClientProfile };

// Fix for ProfileBuilder.tsx type error
export const createClientProfile = async (userId: string): Promise<Partial<ClientProfile> | null> => {
  // Import the implementation from the profile module to avoid circular dependencies
  const { createClientProfileImpl } = await import('./profile');
  return createClientProfileImpl(userId);
}
