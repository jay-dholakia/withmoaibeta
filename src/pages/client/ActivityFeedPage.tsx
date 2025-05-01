
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentActivities } from '@/services/activity-feed-service';
import { Card } from '@/components/ui/card';
import ActivityPost from '@/components/client/ActivityPost';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ActivityFeedPage = () => {
  const { user } = useAuth();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { 
    data: activities, 
    isLoading, 
    error, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const activities = await fetchRecentActivities({ limit: 10 });
      return activities;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    // Subscribe to real-time updates for likes and comments
    const likesChannel = supabase
      .channel('activity-likes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_likes' },
        () => {
          refetch();
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('activity-comments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_comments' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [refetch]);

  const loadMore = async () => {
    if (isLoadingMore || !activities || activities.length === 0) return;
    
    setIsLoadingMore(true);
    try {
      const moreActivities = await fetchRecentActivities({
        offset: activities.length,
        limit: 10
      });
      
      // Update your activities state with the new items
      // This would typically be done using your query library's methods
      setIsLoadingMore(false);
    } catch (error) {
      console.error('Error loading more activities:', error);
      setIsLoadingMore(false);
    }
  };

  // Function to handle scroll and load more content when near bottom
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >= 
      document.documentElement.offsetHeight - 500 &&
      !isLoadingMore
    ) {
      loadMore();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activities, isLoadingMore]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Error loading activity feed. Please try again later.
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500 dark:text-gray-400">
        No workouts found. Be the first to log a workout!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center mb-4">Community Activity</h1>
      
      <div className="space-y-4">
        {activities.map(activity => (
          <ActivityPost 
            key={activity.id} 
            activity={activity} 
            currentUserId={user?.id || ''}
          />
        ))}
      </div>
      
      {isLoadingMore && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-client" />
        </div>
      )}
    </div>
  );
};

export default ActivityFeedPage;
