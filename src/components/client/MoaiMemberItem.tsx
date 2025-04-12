
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
  // Format the display name to show first name and first initial of last name
  const getDisplayName = () => {
    const firstName = member.profileData?.first_name;
    const lastName = member.profileData?.last_name;
    
    if (firstName) {
      const lastInitial = lastName ? `${lastName.charAt(0)}.` : '';
      return `${firstName} ${lastInitial}`.trim();
    }
    
    // Fallback to email username if no first name is available
    return member.email.split('@')[0];
  };
  
  const displayName = getDisplayName();
  
  // Get the initials from first and last name
  const getInitials = (): string => {
    const firstName = member.profileData?.first_name;
    const lastName = member.profileData?.last_name;
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    
    // Fallback to first two letters of display name
    return displayName.substring(0, 2).toUpperCase();
  };
  
  const initials = getInitials();
  
  return (
    <Card 
      className="hover:bg-accent cursor-pointer transition-colors duration-200"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={member.profileData?.avatar_url || ''} alt={displayName} />
          <AvatarFallback className="bg-client/80 text-white">
            {initials}
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
