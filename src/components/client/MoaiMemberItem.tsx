
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isThisWeek } from 'date-fns';

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
  const [isOpen, setIsOpen] = useState(false);
  
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
  
  // Fetch member's workout completions for this week
  const { data: weeklyWorkouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['member-weekly-workouts', member.userId, isOpen],
    queryFn: async () => {
      if (!isOpen) return [];
      
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Set to last Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('workout_completions')
        .select(`
          id,
          completed_at,
          title,
          workout_type,
          notes,
          workout:workout_id (
            title,
            workout_type
          )
        `)
        .eq('user_id', member.userId)
        .gte('completed_at', startOfWeek.toISOString())
        .order('completed_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching member workouts:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: isOpen,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick handler
    setIsOpen(!isOpen);
  };
  
  const getWorkoutType = (workout: any): string => {
    // Determine workout type based on available data
    const workoutType = workout.workout_type || (workout.workout && workout.workout.workout_type);
    
    // Map specific types or provide fallbacks
    if (!workoutType) return 'strength';
    if (workoutType.toLowerCase().includes('basketball')) return 'basketball';
    if (workoutType.toLowerCase().includes('golf')) return 'golf';
    if (workoutType.toLowerCase().includes('volleyball')) return 'volleyball';
    if (workoutType.toLowerCase().includes('baseball')) return 'baseball';
    if (workoutType.toLowerCase().includes('tennis')) return 'tennis';
    if (workoutType.toLowerCase().includes('hiking')) return 'hiking';
    if (workoutType.toLowerCase().includes('skiing')) return 'skiing';
    if (workoutType.toLowerCase().includes('yoga')) return 'yoga';
    if (workoutType.toLowerCase().includes('strength')) return 'strength';
    if (workoutType.toLowerCase().includes('body') || workoutType.toLowerCase().includes('weight')) return 'bodyweight';
    if (workoutType.toLowerCase().includes('flex')) return 'flexibility';
    if (workoutType.toLowerCase().includes('hiit')) return 'hiit';
    if (workoutType.toLowerCase().includes('swim')) return 'swimming';
    if (workoutType.toLowerCase().includes('cycl') || workoutType.toLowerCase().includes('bike')) return 'cycling';
    if (workoutType.toLowerCase().includes('dance')) return 'dance';
    return 'strength';  // Default to strength
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card 
        className="hover:bg-accent transition-colors duration-200"
      >
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3" onClick={onClick}>
              <Avatar>
                <AvatarImage src={member.profileData?.avatar_url || ''} alt={displayName} />
                <AvatarFallback className="bg-client/80 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{displayName}</span>
                  {member.isCurrentUser && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div onClick={handleToggle}>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <h4 className="text-sm font-medium mb-2">This week's workouts:</h4>
            {isLoadingWorkouts ? (
              <div className="text-sm text-muted-foreground">Loading workouts...</div>
            ) : weeklyWorkouts && weeklyWorkouts.length > 0 ? (
              <div className="space-y-2">
                {weeklyWorkouts.map((workout) => (
                  <div key={workout.id} className="bg-muted/50 p-2 rounded-md text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <WorkoutTypeIcon 
                          type={getWorkoutType(workout) as any} 
                          size="sm" 
                          className="mr-2" 
                        />
                        <span className="font-medium">
                          {workout.title || (workout.workout && workout.workout.title) || "Workout"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(workout.completed_at), 'EEE, MMM d')}
                      </span>
                    </div>
                    {workout.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic truncate">
                        {workout.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No workouts completed this week.</div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default MoaiMemberItem;
