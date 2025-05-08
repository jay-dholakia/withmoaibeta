
import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MemberLeaderboardItem } from '@/services/group-leaderboard-service';
import { FireBadge } from './FireBadge';
import { Trophy, Medal } from 'lucide-react';

interface GroupLeaderboardItemProps {
  item: MemberLeaderboardItem;
}

export const GroupLeaderboardItemCard: React.FC<GroupLeaderboardItemProps> = ({ item }) => {
  // Determine if this is a top ranked position (1-3)
  const isTopRank = item.rank && item.rank <= 3;
  
  // Get the rank icon based on position
  const getRankIcon = () => {
    if (!item.rank) return null;
    
    switch (item.rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-sm font-semibold text-muted-foreground">{item.rank}</span>;
    }
  };
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    const firstName = item.first_name || '';
    const lastName = item.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };
  
  return (
    <Card className={`p-3 flex items-center justify-between ${isTopRank ? 'bg-muted/50' : ''}`}>
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-shrink-0 flex items-center justify-center w-8">
          {getRankIcon()}
        </div>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.avatar_url || ''} alt={`${item.first_name} ${item.last_name}`} />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {item.first_name} {item.last_name}
          </p>
          
          {item.city && (
            <p className="text-xs text-muted-foreground truncate">
              {item.city}{item.state ? `, ${item.state}` : ''}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {item.completion_streak && item.completion_streak > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-medium">{item.completion_streak}</span>
            <span>streak</span>
          </div>
        )}
        
        <FireBadge count={item.fire_badges_count} />
      </div>
    </Card>
  );
};
