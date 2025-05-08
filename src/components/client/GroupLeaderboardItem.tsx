
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GroupLeaderboardItem } from '@/services/clients/group-leaderboard';
import { Fire } from 'lucide-react';

interface GroupLeaderboardItemCardProps {
  item: GroupLeaderboardItem;
}

export const GroupLeaderboardItemCard: React.FC<GroupLeaderboardItemCardProps> = ({ item }) => {
  const initials = [item.first_name?.[0] || '', item.last_name?.[0] || '']
    .filter(Boolean)
    .join('')
    .toUpperCase();
  
  const displayName = [item.first_name, item.last_name]
    .filter(Boolean)
    .join(' ') || 'Anonymous';

  const location = [item.city, item.state]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-3 pb-3">
          <div className="flex-shrink-0 mr-3 relative">
            {item.rank && item.rank <= 3 && (
              <span 
                className={`absolute -left-1.5 -top-1.5 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold
                  ${item.rank === 1 ? 'bg-yellow-400 text-yellow-900' : 
                    item.rank === 2 ? 'bg-gray-300 text-gray-700' : 
                    'bg-amber-600 text-amber-100'}`}
              >
                {item.rank}
              </span>
            )}
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={item.avatar_url || ''} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm truncate mb-1">{displayName}</p>
                {location && (
                  <p className="text-xs text-muted-foreground truncate">{location}</p>
                )}
              </div>
              
              <Badge 
                variant="outline" 
                className="bg-orange-100 text-orange-800 border-orange-200 flex items-center space-x-1"
              >
                <Fire className="h-3 w-3" />
                <span>{item.fire_badges_count}</span>
              </Badge>
            </div>
            
            {item.completion_streak && item.completion_streak > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{item.completion_streak}</span> week streak
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
