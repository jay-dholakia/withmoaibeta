
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users } from 'lucide-react';
import { Flame } from 'lucide-react';
import { GroupLeaderboardItem } from '@/services/client-service';

interface GroupLeaderboardItemProps {
  group: GroupLeaderboardItem;
  rank: number;
}

export const GroupLeaderboardItemCard: React.FC<GroupLeaderboardItemProps> = ({ group, rank }) => {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 bg-client/10 dark:bg-blue-900/40 rounded-full text-client dark:text-blue-300 font-bold">
            {rank <= 3 ? <Trophy className="h-5 w-5" /> : `#${rank}`}
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium dark:text-white text-lg">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{group.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" fill="#f97316" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fire Badges</p>
              <p className="font-semibold text-lg">{group.totalFireBadges}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-client dark:text-blue-300" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
              <p className="font-semibold text-lg">{group.activeMembersCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
