
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFireBadges = (userId: string) => {
  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [isCurrentWeekEarned, setIsCurrentWeekEarned] = useState<boolean>(false);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fire-badges', userId],
    queryFn: async () => {
      if (!userId) return { count: 0, current_week: false };
      
      console.log(`Fetching fire badge count for user ${userId}`);
      
      // Get the badge count
      const { data: countData, error: countError } = await supabase
        .rpc('count_user_fire_badges', { user_id_param: userId });
        
      if (countError) {
        console.error("Error fetching badge count:", countError);
        return { count: 0, current_week: false };
      }
      
      // Get the current week start date
      const { data: weekStartData, error: weekStartError } = await supabase
        .rpc('get_pacific_week_start');
        
      if (weekStartError) {
        console.error("Error fetching week start:", weekStartError);
        return { count: countData || 0, current_week: false };
      }
      
      // Check if the user has earned a badge for the current week
      const { data: currentWeekBadge, error: badgeError } = await supabase
        .from('fire_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStartData)
        .maybeSingle();
        
      if (badgeError) {
        console.error("Error checking current week badge:", badgeError);
        return { count: countData || 0, current_week: false };
      }
      
      console.log(`User ${userId} has badge for current week: ${!!currentWeekBadge}`);
      
      // If no badge for current week, check if the user would qualify now
      let wouldQualify = false;
      if (!currentWeekBadge) {
        const { data: weekCompletion, error: weekCompletionError } = await supabase
          .rpc('check_user_weekly_completion', { 
            check_user_id: userId, 
            week_start_date: weekStartData 
          });
          
        if (!weekCompletionError) {
          wouldQualify = !!weekCompletion;
          console.log(`User ${userId} would qualify for badge: ${wouldQualify}`);
        }
      }
      
      return { 
        count: countData || 0, 
        current_week: !!currentWeekBadge || wouldQualify 
      };
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute to ensure more frequent updates
  });
  
  useEffect(() => {
    if (data) {
      setBadgeCount(data.count);
      setIsCurrentWeekEarned(data.current_week);
    }
  }, [data]);
  
  // Set up real-time subscription to update badges when they change
  useEffect(() => {
    if (!userId) return;
    
    console.log(`Setting up real-time subscription for fire badges for user ${userId}`);
    
    const channel = supabase
      .channel('fire-badges-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE and DELETE
          schema: 'public',
          table: 'fire_badges',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Fire badge change detected:', payload);
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up fire badges subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);
  
  return { 
    badgeCount, 
    isCurrentWeekEarned,
    isLoading,
    refetch
  };
};
