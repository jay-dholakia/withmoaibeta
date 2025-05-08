
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Flame } from 'lucide-react';
import { GroupLeaderboardItem } from '@/services/client-service';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import MemberBadgeItem from './MemberBadgeItem';
import { fetchGroupMembersWithBadges } from '@/services/group-leaderboard-service';
import { Skeleton } from '@/components/ui/skeleton';

interface GroupMember {
  id: string;
  name: string;
  profile_picture_url: string;
}

interface GroupLeaderboardItemProps {
  group: GroupLeaderboardItem;
  rank: number;
}

export const GroupLeaderboardItemCard: React.FC<GroupLeaderboardItemProps> = ({ group, rank }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (open: boolean) => {
    setIsOpen(open);
    
    if (open && members.length === 0) {
      setIsLoading(true);
      try {
        const groupMembers = await fetchGroupMembersWithBadges(group.id);
        setMembers(groupMembers);
      } catch (error) {
        console.error('Error fetching group members:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={handleToggle} 
      className="dark:bg-gray-800 dark:border-gray-700 mb-4"
    >
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer">
            <div className="flex items-center justify-between">
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
              
              <div className="ml-2">
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
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
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mx-4 mb-4 border-t dark:border-gray-700 pt-2">
            <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Group Members</h4>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : members.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                {members.map(member => (
                  <MemberBadgeItem key={member.id} member={member} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground dark:text-gray-400 py-2">
                No members found in this group.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
