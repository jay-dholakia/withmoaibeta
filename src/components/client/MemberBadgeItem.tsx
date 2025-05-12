import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFireBadges } from '@/hooks/useFireBadges';
import { FireBadge } from './FireBadge';

interface GroupMember {
  id: string;
  name: string;
  profile_picture_url: string;
}

interface MemberBadgeItemProps {
  member: GroupMember;
}

const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const MemberBadgeItem: React.FC<MemberBadgeItemProps> = ({ member }) => {
  const { badgeCount, isCurrentWeekEarned } = useFireBadges(member.id);

  return (
    <div className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
      <Avatar className="h-6 w-6 mr-2">
        {member.profile_picture_url ? (
          <AvatarImage src={member.profile_picture_url} alt={member.name} />
        ) : (
          <AvatarFallback className="bg-client/80 text-white text-xs">
            {getInitials(member.name)}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="flex-grow text-sm dark:text-gray-100">{member.name}</span>
      {badgeCount > 0 && (
        <div className="ml-2">
          <FireBadge count={badgeCount} isCurrentWeekEarned={isCurrentWeekEarned} />
        </div>
      )}
    </div>
  );
};

export default MemberBadgeItem;
