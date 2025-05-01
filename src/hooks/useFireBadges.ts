
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
        }
      }
      
      return { 
        count: countData || 0, 
        current_week: !!currentWeekBadge || wouldQualify 
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        () => {
          // Refetch when any badge change happens for this user
          console.log('Fire badge change detected, refetching...');
          refetch();
        }
      )
      .subscribe();
      
    return () => {
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
