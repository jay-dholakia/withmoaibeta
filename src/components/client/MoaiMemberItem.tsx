
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import MoaiMemberWeeklyActivity from './MoaiMemberWeeklyActivity';

interface MemberProps {
  member: {
    userId: string;
    email: string;
    isCurrentUser: boolean;
    profileData?: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    };
  };
  onClick: () => void;
}

const MoaiMemberItem: React.FC<MemberProps> = ({ member, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const firstName = member.profileData?.first_name || member.email.split('@')[0];
  const lastName = member.profileData?.last_name || '';
  const displayName = firstName + (lastName ? ` ${lastName.charAt(0)}.` : '');
  
  const handleClick = (e: React.MouseEvent) => {
    // If we're clicking on the collapsible trigger or its children, do nothing
    if ((e.target as HTMLElement).closest('.collapsible-trigger')) {
      return;
    }
    onClick();
  };

  return (
    <div 
      className="flex flex-col border rounded-lg shadow-sm bg-white"
    >
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5 flex-1">
          <Avatar className="h-8 w-8 border">
            <AvatarImage 
              src={member.profileData?.avatar_url || ''} 
              alt={displayName} 
            />
            <AvatarFallback className="bg-client/80 text-white">
              {firstName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium whitespace-nowrap">
              {displayName}
              {member.isCurrentUser && <span className="text-xs ml-1.5 text-muted-foreground">(You)</span>}
            </span>
          </div>
        </div>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger className="collapsible-trigger ml-auto flex items-center justify-center h-7 w-7 rounded-full hover:bg-slate-100" onClick={(e) => e.stopPropagation()}>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t mt-1">
            <MoaiMemberWeeklyActivity userId={member.userId} userName={displayName} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default MoaiMemberItem;
