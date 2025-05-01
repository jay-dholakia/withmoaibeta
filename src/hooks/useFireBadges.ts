
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FireBadge {
  id: string;
  user_id: string;
  week_start: string;
  created_at: string;
}

export const useFireBadges = (userId: string) => {
  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [isCurrentWeekEarned, setIsCurrentWeekEarned] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFireBadges = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get total badge count
        const { data: count, error: countError } = await supabase.rpc(
          'count_user_fire_badges',
          { user_id_param: userId }
        );
        
        if (countError) {
          console.error('Error fetching badge count:', countError);
          return;
        }

        setBadgeCount(count || 0);
        
        // Get current week's start date
        const { data: currentWeekStart, error: weekError } = await supabase.rpc(
          'get_pacific_week_start'
        );
        
        if (weekError) {
          console.error('Error getting current week start:', weekError);
          return;
        }
        
        // Check if user has a badge for current week
        const { data: currentWeekBadge, error: badgeError } = await supabase
          .from('fire_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('week_start', currentWeekStart)
          .maybeSingle();
          
        if (badgeError) {
          console.error('Error checking current week badge:', badgeError);
          return;
        }
        
        setIsCurrentWeekEarned(!!currentWeekBadge);
      } catch (error) {
        console.error('Error in useFireBadges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFireBadges();
    
    // Set up a subscription to listen for badge changes
    const channel = supabase
      .channel('fire-badge-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'fire_badges',
          filter: `user_id=eq.${userId}`
        }, 
        () => {
          // Refetch badges when there are changes
          fetchFireBadges();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    badgeCount,
    isCurrentWeekEarned,
    isLoading
  };
};
