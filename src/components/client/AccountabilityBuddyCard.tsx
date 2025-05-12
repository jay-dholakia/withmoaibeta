
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, RefreshCw } from 'lucide-react';
import { BuddyDisplayInfo } from '@/services/accountability-buddy-service';
import { Link } from 'react-router-dom';
import { FireBadge } from './FireBadge';
import { useFireBadges } from '@/hooks/useFireBadges';
import { useQueryClient } from '@tanstack/react-query';

interface AccountabilityBuddyCardProps {
  buddies: BuddyDisplayInfo[];
  isAdmin?: boolean;
  groupId: string;
  onRefresh: () => Promise<void>;
  loading?: boolean;
}

export const AccountabilityBuddyCard: React.FC<AccountabilityBuddyCardProps> = ({ 
  buddies, 
  isAdmin = false,
  groupId,
  onRefresh,
  loading = false
}) => {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await onRefresh();
    
    // Also invalidate fire badge queries to update any badges
    queryClient.invalidateQueries({queryKey: ['fire-badges']});
    queryClient.invalidateQueries({queryKey: ['accountability-buddies', groupId]});
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>Your Accountability Buddies</span>
        </CardTitle>
        {isAdmin && (
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reassign Buddies
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!buddies || buddies.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No buddies assigned yet.
              {isAdmin && ' Click "Reassign Buddies" to create buddy pairings.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Connect with your accountability buddies to keep each other motivated and on track!
            </div>
            
            <div className="grid gap-3">
              {buddies.map((buddy) => (
                <BuddyItem key={buddy.userId} buddy={buddy} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface BuddyItemProps {
  buddy: BuddyDisplayInfo;
}

const BuddyItem: React.FC<BuddyItemProps> = ({ buddy }) => {
  const { badgeCount, isCurrentWeekEarned } = useFireBadges(buddy.userId);
  
  const fullName = [buddy.firstName, buddy.lastName].filter(Boolean).join(' ') || buddy.name;
  const initials = [buddy.firstName?.[0], buddy.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || buddy.name.substring(0, 2).toUpperCase();
    
  return (
    <div className="flex items-center p-2 rounded-md hover:bg-muted transition-colors">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={buddy.avatarUrl || ''} alt={buddy.name} />
        <AvatarFallback className="bg-client/80 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <p className="font-medium truncate">{fullName}</p>
          {badgeCount > 0 && (
            <div className="ml-2">
              <FireBadge count={badgeCount} isCurrentWeekEarned={isCurrentWeekEarned} />
            </div>
          )}
        </div>
        {buddy.firstName && (
          <p className="text-xs text-muted-foreground truncate">Your accountability buddy</p>
        )}
      </div>
      
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/chat?with=${buddy.userId}`}>
          Chat
        </Link>
      </Button>
    </div>
  );
};
