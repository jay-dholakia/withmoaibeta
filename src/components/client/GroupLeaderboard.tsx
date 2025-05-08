
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGroupLeaderboard } from '@/services/client-service';
import { GroupLeaderboardItemCard } from '@/components/client/GroupLeaderboardItem';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const GroupLeaderboard: React.FC = () => {
  const { 
    data: groups, 
    isLoading, 
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['group-leaderboard'],
    queryFn: fetchGroupLeaderboard,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, i) => (
      <div key={`skeleton-${i}`} className="space-y-3 bg-background rounded-lg border p-4 mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <h1 className="text-2xl font-bold text-center mb-4">Group Leaderboard</h1>
        {renderSkeletons()}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8 bg-background rounded-lg border">
        <h1 className="text-2xl font-bold mb-4">Group Leaderboard</h1>
        <div className="text-red-500 dark:text-red-400 mb-4">
          Unable to load leaderboard data. Please try again.
        </div>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-client hover:bg-client/90 text-white rounded-md"
          disabled={isFetching}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center p-8 bg-background rounded-lg border">
        <h1 className="text-2xl font-bold mb-4">Group Leaderboard</h1>
        <div className="text-gray-500 dark:text-gray-400 mb-8">
          No groups found. Groups with fire badges will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center mb-4">Group Leaderboard</h1>
      
      <div className="space-y-1">
        {groups.map((group, index) => (
          <GroupLeaderboardItemCard 
            key={group.id}
            group={group}
            rank={index + 1}
          />
        ))}
      </div>
      
      {/* Background fetch indicator */}
      {isFetching && !isLoading && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-client" />
        </div>
      )}
    </div>
  );
};
