
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MemberItemProps {
  member: {
    userId: string;
    email: string;
    isCurrentUser: boolean;
    profileData?: {
      first_name?: string | null;
      last_name?: string | null;
      avatar_url?: string | null;
    };
  };
  onClick: () => void;
}

const MoaiMemberItem: React.FC<MemberItemProps> = ({ member, onClick }) => {
  const displayName = member.profileData?.first_name 
    ? `${member.profileData.first_name} ${member.profileData.last_name || ''}` 
    : member.email.split('@')[0];
  
  return (
    <Card 
      className="hover:bg-accent cursor-pointer transition-colors duration-200"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={member.profileData?.avatar_url || ''} alt={displayName} />
          <AvatarFallback className="bg-client/80 text-white">
            {displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{displayName}</span>
            {member.isCurrentUser && (
              <Badge variant="outline" className="text-xs">You</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoaiMemberItem;
