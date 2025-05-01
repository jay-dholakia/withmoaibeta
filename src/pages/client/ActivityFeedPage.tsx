
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentActivities } from '@/services/activity-feed-service';
import ActivityPost from '@/components/client/ActivityPost';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const ActivityFeedPage = () => {
  const { user } = useAuth();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  
  const { 
    data: initialActivities, 
    isLoading, 
    error, 
    refetch,
    isError
  } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      try {
        console.log("Fetching initial activities");
        const activities = await fetchRecentActivities({ limit: 10 });
        console.log("Initial activities fetched:", activities?.length || 0);
        if (activities && activities.length > 0) {
          setActivities(activities); // Set initial activities
        }
        return activities || [];
      } catch (err) {
        console.error("Error in query function:", err);
        toast.error("Failed to load activities. Please try again later.");
        throw err;
      }
    },
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
  });

  useEffect(() => {
    // Subscribe to real-time updates for likes and comments
    const likesChannel = supabase
      .channel('activity-likes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_likes' },
        () => {
          console.log("Received real-time update for likes");
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
          console.log("Received real-time update for comments");
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
      console.log("Loading more activities from offset:", activities.length);
      const moreActivities = await fetchRecentActivities({
        offset: activities.length,
        limit: 10
      });
      
      console.log("More activities fetched:", moreActivities?.length || 0);
      
      // Update activities state with new items
      if (moreActivities && moreActivities.length > 0) {
        setActivities(prevActivities => [...prevActivities, ...moreActivities]);
      } else {
        toast.info("No more activities to load");
      }
    } catch (error) {
      console.error('Error loading more activities:', error);
      toast.error("Failed to load more activities");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Function to handle scroll and load more content when near bottom
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >= 
      document.documentElement.offsetHeight - 500 &&
      !isLoadingMore &&
      activities.length > 0
    ) {
      loadMore();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activities, isLoadingMore]);

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={`skeleton-${i}`} className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-8 py-4">
        <h1 className="text-2xl font-bold text-center mb-4">Community Activity</h1>
        {renderSkeletons()}
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Community Activity</h1>
        <div className="text-red-500 dark:text-red-400 mb-4">
          Unable to load activities. Please try again later.
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Community Activity</h1>
        <div className="text-gray-500 dark:text-gray-400 mb-8">
          No workouts found. Be the first to log a workout!
        </div>
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

      {activities.length > 0 && !isLoadingMore && (
        <div className="flex justify-center mt-4 mb-8">
          <Button 
            onClick={loadMore} 
            variant="outline"
            className="text-client border-client hover:bg-client/10"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeedPage;
