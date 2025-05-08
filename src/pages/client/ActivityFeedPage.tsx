
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentActivities } from '@/services/activity-feed-service';
import ActivityPost from '@/components/client/ActivityPost';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { GroupLeaderboard } from '@/components/client/GroupLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const ActivityFeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [groupId, setGroupId] = useState<string | null>(null);
  
  // Fetch the user's primary group ID for the leaderboard
  useEffect(() => {
    const fetchGroupId = async () => {
      if (!user) return;
      
      // For now, we're just using a hardcoded group ID from route
      // In a real implementation, you would fetch the user's groups
      try {
        // Extract group ID from URL if present (e.g. /client-dashboard/moai/{groupId})
        const urlParts = location.pathname.split('/');
        const groupIdFromUrl = urlParts.length > 3 ? urlParts[3] : null;
        
        if (groupIdFromUrl) {
          setGroupId(groupIdFromUrl);
        } else {
          // When implementing actual group fetching, put that logic here
          console.log('No group ID found in URL, would fetch primary group');
        }
      } catch (error) {
        console.error('Error fetching user group:', error);
        toast.error('Failed to load group information');
      }
    };
    
    fetchGroupId();
  }, [user, location.pathname]);
  
  // Update the useQuery call to use the object format properly
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: fetchRecentActivities, // Now it will work with the updated function
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Main content - Activity Feed */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">Activity Feed</h1>
          <Separator />
        </div>
        
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-destructive">Error loading activity feed</p>
            <p className="text-sm text-muted-foreground">
              Please refresh the page to try again
            </p>
          </div>
        ) : activities && Array.isArray(activities) && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity: any) => (
              <ActivityPost 
                key={activity.id} 
                activity={activity} 
                currentUserId={user?.id || ''}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No activity posts yet</p>
          </div>
        )}
      </div>
      
      {/* Sidebar - Leaderboard */}
      <div className="md:w-72 flex-shrink-0 space-y-6">
        <Card className="p-4">
          <h2 className="font-medium mb-3">Group Leaderboard</h2>
          
          {!groupId ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              <p>Join a group to see the leaderboard</p>
            </div>
          ) : (
            <GroupLeaderboard groupId={groupId} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ActivityFeedPage;
