
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Loader2, Award, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { fetchGroupLeaderboard, GroupLeaderboardItem } from '@/services/group-leaderboard-service';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export const GroupsLeaderboard: React.FC = () => {
  const { 
    data: groups, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['group-leaderboard'],
    queryFn: fetchGroupLeaderboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Error loading leaderboard data.</p>
        <p className="text-sm">Please try again later.</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No groups found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.id} className="overflow-hidden">
          <div 
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => toggleGroupExpansion(group.id)}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-client/10 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <span className="text-client dark:text-blue-300 font-bold">
                  #{group.rank}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-lg">{group.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Award className="h-4 w-4 mr-1 text-orange-500" />
                  <span>{group.total_fire_badges} fire {group.total_fire_badges === 1 ? 'badge' : 'badges'}</span>
                </div>
              </div>
            </div>
            {expandedGroups.includes(group.id) ? 
              <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          
          {expandedGroups.includes(group.id) && (
            <div className="border-t border-border p-3">
              <div className="mb-2 flex items-center text-sm font-medium text-muted-foreground px-1">
                <Users className="h-4 w-4 mr-1" />
                <span>Group Members</span>
              </div>
              <div className="space-y-2">
                {group.members && group.members.sort((a, b) => b.fire_badges_count - a.fire_badges_count).map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {member.first_name} {member.last_name}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Award className="h-3.5 w-3.5 mr-1 text-orange-500" />
                      <span>{member.fire_badges_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
