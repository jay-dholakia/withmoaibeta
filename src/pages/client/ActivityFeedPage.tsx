
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentActivities } from '@/services/activity-feed-service';
import ActivityPost from '@/components/client/ActivityPost';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { BackgroundFetchIndicator } from '@/components/client/BackgroundFetchIndicator';
import { useIsMobile } from '@/lib/hooks';
import { WorkoutHistoryItem } from '@/types/workout';

// Define type for our activity feed data
type ActivityFeedItem = WorkoutHistoryItem & {
  profiles?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  } | null;
  likes?: Array<{
    id: string;
    user_id: string;
    activity_id: string;
    created_at: string;
  }>;
  comments?: Array<{
    id: string;
    user_id: string;
    activity_id: string;
    content: string;
    created_at: string;
    profiles?: {
      id?: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    } | null;
  }>;
};

const ActivityFeedPage = () => {
  const { user } = useAuth();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const isMobile = useIsMobile();
  
  // Main query to fetch initial activities
  const { 
    data: initialActivities, 
    isLoading, 
    error, 
    refetch,
    isError,
    isFetching
  } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      try {
        console.log("Fetching initial activities");
        const activities = await fetchRecentActivities({ limit: 20 }) as ActivityFeedItem[];
        console.log("Initial activities fetched:", activities?.length || 0);
        
        if (activities && activities.length > 0) {
          setActivities(activities); // Set initial activities
          setHasMore(activities.length === 20); // If we got less than requested, there are no more
        } else {
          setHasMore(false);
        }
        
        return activities || [];
      } catch (err) {
        console.error("Error in query function:", err);
        toast.error("Failed to load activities. Please try again later.");
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
  });

  // Function to load more activities
  const loadMore = async () => {
    if (isLoadingMore || !activities || activities.length === 0) return;
    
    setIsLoadingMore(true);
    try {
      console.log("Loading more activities from offset:", activities.length);
      const moreActivities = await fetchRecentActivities({
        offset: activities.length,
        limit: 20
      }) as ActivityFeedItem[];
      
      console.log("More activities fetched:", moreActivities?.length || 0);
      
      if (moreActivities && moreActivities.length > 0) {
        setActivities(prevActivities => [...prevActivities, ...moreActivities]);
        setHasMore(moreActivities.length === 20); // If we got less than requested, there are no more
      } else {
        setHasMore(false);
        toast.info("You've reached the end of the activity feed");
      }
    } catch (error) {
      console.error('Error loading more activities:', error);
      toast.error("Failed to load more activities. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Render functions for different states
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, i) => (
      <div key={`skeleton-${i}`} className="space-y-3 bg-background rounded-lg border p-4">
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

  const renderError = () => (
    <div className="text-center p-8 bg-background rounded-lg border">
      <h1 className="text-2xl font-bold mb-4">Community Activity</h1>
      <div className="text-red-500 dark:text-red-400 mb-4">
        Unable to load activities. Please try again.
      </div>
      <Button 
        onClick={() => refetch()} 
        variant="outline"
        disabled={isFetching}
      >
        Retry {isFetching && <BackgroundFetchIndicator isLoading={isFetching} />}
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <div className="text-center p-8 bg-background rounded-lg border">
      <h1 className="text-2xl font-bold mb-4">Community Activity</h1>
      <div className="text-gray-500 dark:text-gray-400 mb-8">
        No workouts found. Be the first to log a workout!
      </div>
    </div>
  );

  // Main rendering logic
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <h1 className="text-2xl font-bold text-center mb-4">Community Activity</h1>
        {renderSkeletons()}
      </div>
    );
  }

  if (isError || error) {
    return renderError();
  }

  if (!activities || activities.length === 0) {
    return renderEmpty();
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
      
      {isFetching && !isLoadingMore && (
        <div className="flex justify-center p-4">
          <BackgroundFetchIndicator isLoading={true} size={6} />
        </div>
      )}
      
      {isLoadingMore && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-client" />
        </div>
      )}

      {hasMore && !isLoadingMore && (
        <div className="flex justify-center mt-4 mb-8">
          <Button 
            onClick={loadMore} 
            variant="default" 
            size={isMobile ? "sm" : "default"}
            className="bg-client hover:bg-client/90 text-white"
          >
            Load More Activities
          </Button>
        </div>
      )}
      
      {!hasMore && activities.length > 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 pb-4">
          You've reached the end of the activity feed
        </p>
      )}
    </div>
  );
};

export default ActivityFeedPage;
