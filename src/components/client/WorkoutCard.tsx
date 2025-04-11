
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GroupMember } from '@/services/group-member-service';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';
import { getWorkoutTypeLabel } from '@/utils/workout-utils';
import { CalendarCheck, CalendarX, ChevronRight, UserCheck } from 'lucide-react';
import { AddToGoogleCalendarButton } from './AddToGoogleCalendarButton';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface WorkoutCardProps {
  workoutId: string;
  title: string;
  description?: string;
  type?: WorkoutType;
  groupMembers?: GroupMember[];
  currentUserId?: string;
  onStartWorkout: (workoutId: string) => void;
  completed?: boolean;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workoutId,
  title,
  description,
  type = 'strength',
  groupMembers = [],
  currentUserId,
  onStartWorkout,
  completed = false,
}) => {
  const navigate = useNavigate();
  
  const [isHovered, setIsHovered] = useState(false);
  
  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    onStartWorkout(workoutId);
  };

  const memberCompletedCount = groupMembers.filter(m => 
    m.completed_workout_ids.includes(workoutId)
  ).length;

  // Show up to 5 profile images
  const maxProfilesToShow = 5;
  const membersToShow = groupMembers.slice(0, maxProfilesToShow);
  const extraMembersCount = Math.max(0, groupMembers.length - maxProfilesToShow);

  const cardContent = (
    <Card 
      className={`relative overflow-hidden transition-all w-full ${completed ? 'opacity-75' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2 pt-6">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">
            {title}
          </CardTitle>
          <div className="flex items-center">
            <WorkoutTypeIcon type={type} className="text-xl" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        {description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center">
            {completed ? (
              <div className="text-xs flex items-center">
                <CalendarCheck className="h-3 w-3 mr-1 text-green-500" />
                <span>Completed</span>
              </div>
            ) : (
              <div className="text-xs flex items-center">
                <CalendarX className="h-3 w-3 mr-1 text-amber-500" />
                <span>Pending</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {groupMembers.length > 1 && (
              <div className="text-xs mr-2 flex items-center">
                <UserCheck className="h-3 w-3 mr-1 text-sky-500" />
                <span>{memberCompletedCount}/{groupMembers.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Member profiles/completion circles */}
        {groupMembers.length > 1 && (
          <div className="flex -space-x-2 mt-3 overflow-hidden">
            {membersToShow.map((member) => {
              const hasCompleted = member.completed_workout_ids.includes(workoutId);
              
              return (
                <div 
                  key={member.id}
                  className={`inline-block rounded-full ring-2 ${hasCompleted ? 'ring-green-500' : 'ring-gray-200'}`}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={member.profile_picture_url} 
                      alt={member.name} 
                    />
                    <AvatarFallback className="text-[10px]">
                      {member.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              );
            })}
            
            {extraMembersCount > 0 && (
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-[10px] text-gray-600">
                +{extraMembersCount}
              </div>
            )}
          </div>
        )}
        
        {!completed && (
          <div className="flex items-center justify-between mt-4 gap-2">
            <AddToGoogleCalendarButton 
              workoutId={workoutId} 
              title={title}
              description={description}
            />
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-xs"
              onClick={handleStart}
            >
              Start
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  return cardContent;
};
