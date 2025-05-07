
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { ActivityPost } from '@/components/client/ActivityPost';
import { Loader2 } from 'lucide-react';

interface ActivityFeedPageProps {
  inTab?: boolean;
}

export default function ActivityFeedPage({ inTab = false }: ActivityFeedPageProps) {
  const { user } = useAuth();
  const { posts, isLoading, error } = useActivityFeed();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">There was an error loading the activity feed.</p>
        <p className="text-sm text-red-500">{error.message}</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No activity to display yet.</p>
        <p className="text-sm text-muted-foreground">
          Activity will appear here when you or your team members log workouts.
        </p>
      </div>
    );
  }

  // When displayed as a tab, we don't need the outer card wrapper
  if (inTab) {
    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <ActivityPost key={post.id} post={post} />
        ))}
      </div>
    );
  }
  
  // Regular standalone page view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Activity Feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post) => (
          <ActivityPost key={post.id} post={post} />
        ))}
      </CardContent>
    </Card>
  );
}
