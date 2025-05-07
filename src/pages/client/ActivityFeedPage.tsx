
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteQuery } from '@tanstack/react-query';
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
  const isMobile = useIsMobile();
  
  // Use useInfiniteQuery instead of useQuery
  const {
    data, // Data is now structured as { pages: [page1, page2, ...], pageParams: [...] }
    fetchNextPage, // Function to fetch the next page
    hasNextPage, // Boolean indicating if there's a next page
    isLoading, // Initial loading state
    isFetchingNextPage, // Loading state for subsequent pages
    error,
    refetch,
    isError,
    isFetching, // Represents fetching state for initial load or background refresh
  } = useInfiniteQuery({
    queryKey: ['activity-feed'],
    queryFn: async ({ pageParam = 0 }) => { // pageParam starts at 0 (or undefined, handled as 0)
      console.log(`Fetching activities with offset: ${pageParam}`);
      const limit = 20;
      // Fetch activities using the pageParam as offset
      const activities = await fetchRecentActivities({ offset: pageParam, limit }) as ActivityFeedItem[];
      console.log(`Fetched ${activities?.length || 0} activities`);
      // Return the fetched activities and the next offset
      return {
        activities: activities || [],
        nextOffset: activities && activities.length === limit ? pageParam + limit : undefined,
      };
    },
    // Define how to get the next page parameter from the previous page's data
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0, // Start fetching from offset 0
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
  });

  // Flatten the pages array to get a single list of activities
  const activities = data?.pages.flatMap(page => page.activities) ?? [];

  // Update loadMore function to use fetchNextPage
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
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
        onClick={() => refetch()} // Use refetch from useInfiniteQuery
        variant="outline"
        disabled={isFetching} // Disable button while fetching
      >
        Retry {isFetching && !isFetchingNextPage && <BackgroundFetchIndicator isLoading={true} />}
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <div className="text-center p-8 bg-background rounded-lg border">
      <h1 className="text-2xl font-bold mb-4">Community Activity</h1>
      <div className="text-gray-500 dark:text-gray-400 mb-8">
        No community activity found yet.
      </div>
    </div>
  );

  // Main rendering logic
  // Use isLoading for initial load skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <h1 className="text-2xl font-bold text-center mb-4">Community Activity</h1>
        {renderSkeletons()}
      </div>
    );
  }

  // Use isError for error state
  if (isError || error) {
    return renderError();
  }

  // Check flattened activities array for empty state
  if (!activities || activities.length === 0) {
    return renderEmpty();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center mb-4">Community Activity</h1>

      <div className="space-y-4">
        {/* Map over the flattened activities array */}
        {activities.map(activity => (
          <ActivityPost
            key={activity.id}
            activity={activity}
            currentUserId={user?.id || ''}
          />
        ))}
      </div>

      {/* Show background fetch indicator only during refetches, not initial load or next page fetch */}
      {isFetching && !isLoading && !isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <BackgroundFetchIndicator isLoading={true} size={6} />
        </div>
      )}

      {/* Show loader when fetching the next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-client" />
        </div>
      )}

      {/* Show Load More button if there is a next page and not currently fetching */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="flex justify-center mt-4 mb-8">
          <Button
            onClick={loadMore}
            variant="default"
            size={isMobile ? "sm" : "default"}
            className="bg-client hover:bg-client/90 text-white"
            disabled={isFetchingNextPage} // Disable button while fetching next page
          >
            Load More Activities
          </Button>
        </div>
      )}

      {/* Show end message if there are activities but no next page */}
      {!hasNextPage && activities.length > 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 pb-4">
          You've reached the end of the activity feed
        </p>
      )}
    </div>
  );
};

export default ActivityFeedPage;
