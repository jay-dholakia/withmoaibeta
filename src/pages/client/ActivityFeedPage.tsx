
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentActivities } from '@/services/activity-feed';
import ActivityPost from '@/components/client/ActivityPost';
import { Loader2, RefreshCcw, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { GroupLeaderboard } from '@/components/client/GroupLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupsLeaderboard } from '@/components/client/GroupsLeaderboard';

const ActivityFeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("activity");
  
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
  
  // Use the refactored fetchRecentActivities function with useQuery
  const { 
    data: activities, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: fetchRecentActivities,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 2
  });

  console.log('Activity feed data:', { activities, isLoading, error });

  // Function to handle manual refresh
  const handleRefresh = () => {
    refetch();
    toast.info('Refreshing activity feed...');
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Main content - Activity Feed */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-4">Community</h1>
          {activeTab === "activity" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading || isRefetching}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
        <Separator />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity">
            {isLoading || isRefetching ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="py-8 space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error loading activity feed</AlertTitle>
                  <AlertDescription>
                    There was a problem connecting to the server. Please try refreshing the page.
                  </AlertDescription>
                </Alert>
                <div className="text-center">
                  <Button 
                    onClick={handleRefresh}
                    className="mt-2"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
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
                <p className="text-sm text-muted-foreground mt-1">
                  Complete a workout to see it in your activity feed
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="leaderboard">
            <GroupsLeaderboard />
          </TabsContent>
        </Tabs>
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
