
import { useState, useEffect } from 'react';
import { getUserBuddies, generateWeeklyBuddies } from '@/services/accountability-buddy-service';
import { checkAndGenerateBuddies } from '@/services/cron-utils';
import { BuddyDisplayInfo } from '@/services/accountability-buddy-service';

export function useAccountabilityBuddies(
  groupId: string | null,
  userId: string | undefined
) {
  const [buddies, setBuddies] = useState<BuddyDisplayInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBuddies() {
      if (!groupId || !userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Loading buddies for group ${groupId} and user ${userId}`);
        
        // First check if we need to generate new buddies for this week
        await checkAndGenerateBuddies(groupId);
        
        // Then load the user's buddies
        const userBuddies = await getUserBuddies(groupId, userId);
        console.log(`Found ${userBuddies.length} buddies for user:`, userBuddies);
        setBuddies(userBuddies);
      } catch (err) {
        console.error('Error loading accountability buddies:', err);
        setError('Failed to load accountability buddies');
      } finally {
        setLoading(false);
      }
    }
    
    loadBuddies();
  }, [groupId, userId]);

  const refreshBuddies = async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      console.log(`Refreshing buddies for group ${groupId}`);
      await generateWeeklyBuddies(groupId);
      
      if (userId) {
        const userBuddies = await getUserBuddies(groupId, userId);
        setBuddies(userBuddies);
      }
    } catch (err) {
      console.error('Error refreshing accountability buddies:', err);
      setError('Failed to refresh accountability buddies');
    } finally {
      setLoading(false);
    }
  };

  return {
    buddies,
    loading,
    error,
    refreshBuddies
  };
}
