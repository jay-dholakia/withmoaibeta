
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HeartIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { likeActivity, unlikeActivity } from '@/services/activity-feed-service';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';

interface ActivityPostProps {
  activity: any; // Using any temporarily until we create proper type
  currentUserId: string;
}

const ActivityPost: React.FC<ActivityPostProps> = ({ activity, currentUserId }) => {
  const [isLiking, setIsLiking] = useState(false);

  // Check for profiles data structure
  const userProfile = activity.profiles || {};
  const userName = userProfile.first_name 
    ? `${userProfile.first_name} ${userProfile.last_name || ''}`
    : 'Anonymous User';

  const userInitials = userProfile.first_name 
    ? `${userProfile.first_name[0]}${userProfile.last_name?.[0] || ''}`
    : 'AU';
    
  const likes = activity.likes || [];
  const isLiked = likes.some((like: any) => like.user_id === currentUserId);
  const completedAtDate = activity.completed_at ? new Date(activity.completed_at) : new Date();
  const timeAgo = formatDistanceToNow(completedAtDate, { addSuffix: true });

  const handleLikeToggle = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      if (isLiked) {
        await unlikeActivity(activity.id);
      } else {
        await likeActivity(activity.id);
      }
    } catch (error) {
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            {userProfile.avatar_url ? (
              <AvatarImage src={userProfile.avatar_url} alt={userName} />
            ) : (
              <AvatarFallback className="bg-client text-white dark:bg-blue-700">
                {userInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium dark:text-white">{userName}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
          </div>
          {activity.workout_type && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
              <WorkoutTypeIcon type={activity.workout_type as any} className="h-3 w-3" />
              <span>{activity.workout_type}</span>
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <h4 className="font-bold mb-1 dark:text-white">{activity.title || "Workout Completed"}</h4>
        {activity.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{activity.description}</p>
        )}
        {activity.notes && (
          <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md text-sm mt-1">
            <p className="text-gray-700 dark:text-gray-300">{activity.notes}</p>
          </div>
        )}
        {activity.duration && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Duration: {activity.duration}
          </p>
        )}
        {activity.distance && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Distance: {activity.distance}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col pt-0">
        <div className="flex items-center justify-between w-full py-2 border-t border-gray-100 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`gap-1 ${isLiked ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <HeartIcon className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} />
            <span>{likes.length}</span>
          </Button>
          
          {/* Spacer to maintain layout balance */}
          <div></div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ActivityPost;
