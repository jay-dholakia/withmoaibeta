
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeartIcon, MessageCircleIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { likeActivity, unlikeActivity, addComment, deleteComment } from '@/services/activity-feed-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';

interface ActivityPostProps {
  activity: any; // Using any temporarily until we create proper type
  currentUserId: string;
}

const ActivityPost: React.FC<ActivityPostProps> = ({ activity, currentUserId }) => {
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
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
  const comments = activity.comments || [];
  const isLiked = likes.some((like: any) => like.user_id === currentUserId);
  const completedAtDate = activity.completed_at ? new Date(activity.completed_at) : new Date();
  const timeAgo = formatDistanceToNow(completedAtDate, { addSuffix: true });

  // Sort comments by creation date (newest first)
  const sortedComments = [...comments].sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Display only 2 most recent comments if not showing all
  const visibleComments = showAllComments 
    ? sortedComments 
    : sortedComments.slice(0, 2);

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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      await addComment(activity.id, newComment);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllComments(!showAllComments)}
            className="gap-1 text-gray-500 dark:text-gray-400"
          >
            <MessageCircleIcon className="h-5 w-5" />
            <span>{comments.length}</span>
          </Button>
        </div>
        
        {/* Comments section */}
        {visibleComments.length > 0 && (
          <div className="w-full pt-2 space-y-2 max-h-60 overflow-y-auto">
            {visibleComments.map((comment: any) => {
              const commentProfile = comment.profiles || {};
              const commentUserName = commentProfile.first_name 
                ? `${commentProfile.first_name} ${commentProfile.last_name || ''}`
                : 'Unknown User';
              const commentUserInitials = commentProfile.first_name?.[0] || 'U';
              
              return (
                <div key={`${comment.id}-${comment.user_id}`} className="flex gap-2 items-start">
                  <Avatar className="h-6 w-6">
                    {commentProfile.avatar_url ? (
                      <AvatarImage src={commentProfile.avatar_url} />
                    ) : (
                      <AvatarFallback className="text-xs bg-client text-white dark:bg-blue-700">
                        {commentUserInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-xs text-gray-800 dark:text-gray-200">
                        {commentUserName}
                      </span>
                      {comment.user_id === currentUserId && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 p-0 text-gray-400"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2Icon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {!showAllComments && comments.length > 2 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAllComments(true)}
                className="text-sm text-client dark:text-blue-400 w-full"
              >
                View all {comments.length} comments
              </Button>
            )}
          </div>
        )}
        
        {/* Add comment form */}
        <form 
          onSubmit={handleSubmitComment} 
          className="flex gap-2 w-full mt-2 pt-2 border-t border-gray-100 dark:border-gray-700"
        >
          <Input
            className="flex-1 h-9 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button 
            type="submit" 
            size="sm"
            variant="ghost" 
            disabled={!newComment.trim() || isSubmittingComment}
            className="h-9 px-2"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default ActivityPost;
