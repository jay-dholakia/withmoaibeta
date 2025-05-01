
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import MoaiMemberWeeklyActivity from './MoaiMemberWeeklyActivity';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FireBadge } from './FireBadge';

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
  
  // Create initials from first and last name
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  const initials = `${firstInitial}${lastInitial}`;
  
  const handleClick = (e: React.MouseEvent) => {
    // If we're clicking on the collapsible trigger or its children, do nothing
    if ((e.target as HTMLElement).closest('.collapsible-trigger')) {
      return;
    }
    onClick();
  };

  return (
    <div 
      className="flex flex-col border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700"
    >
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5 flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-10 w-10 border dark:border-gray-600">
                  <AvatarImage 
                    src={member.profileData?.avatar_url || ''} 
                    alt={displayName} 
                  />
                  <AvatarFallback className="bg-client/80 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <span className="font-medium whitespace-nowrap">
                  {displayName}
                  {member.isCurrentUser && <span className="text-xs ml-1.5 text-muted-foreground dark:text-gray-300">(You)</span>}
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-1.5">
            <span className="font-medium whitespace-nowrap dark:text-white">
              {displayName}
              {member.isCurrentUser && <span className="text-xs ml-1.5 text-muted-foreground dark:text-gray-300">(You)</span>}
            </span>
            
            {/* Fire Badge */}
            <FireBadge userId={member.userId} className="ml-1" />
          </div>
        </div>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger className="collapsible-trigger ml-auto flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-gray-600" onClick={(e) => e.stopPropagation()}>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t dark:border-gray-700 mt-1">
            <MoaiMemberWeeklyActivity userId={member.userId} userName={displayName} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export default MoaiMemberItem;
