
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGroupLeaderboard } from '@/services/clients/group-leaderboard';
import { GroupLeaderboardItemCard } from '@/components/client/GroupLeaderboardItem';
import { Loader2 } from 'lucide-react';

interface GroupLeaderboardProps {
  groupId: string;
  className?: string;
}

export const GroupLeaderboard: React.FC<GroupLeaderboardProps> = ({ groupId, className }) => {
  const { data: leaderboardData, isLoading, isError, error } = useQuery({
    queryKey: ['group-leaderboard', groupId],
    queryFn: async () => {
      try {
        if (!groupId) {
          throw new Error('Group ID is required');
        }
        const data = await fetchGroupLeaderboard(groupId);
        return data;
      } catch (err) {
        console.error('Error fetching group leaderboard:', err);
        throw err;
      }
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-destructive">Failed to load leaderboard.</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-muted-foreground">No leaderboard data available yet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {leaderboardData.map((item) => (
        <GroupLeaderboardItemCard key={item.user_id} item={item} />
      ))}
    </div>
  );
};
