
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { fetchLatestCoachMessage, CoachMessage, markCoachMessageAsRead } from '@/services/coach-message-service';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CoachMessageCardProps {
  userId: string;
}

export const CoachMessageCard: React.FC<CoachMessageCardProps> = ({ userId }) => {
  const [message, setMessage] = useState<CoachMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMessage = async () => {
      if (!userId) return;
      
      setLoading(true);
      const coachMessage = await fetchLatestCoachMessage(userId);
      setMessage(coachMessage);
      setLoading(false);
      
      // Mark the message as read if we have one
      if (coachMessage && !coachMessage.read_by_client) {
        await markCoachMessageAsRead(coachMessage.id);
      }
    };

    loadMessage();
  }, [userId]);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!message) {
    return (
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-60" />
            <p>No messages from your coach yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-medium">
          Message from Coach {message.coach_first_name || 'Your Coach'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Week of {new Date(message.week_of).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-4 border-client pl-4 italic">
          "{message.message}"
        </blockquote>
      </CardContent>
    </Card>
  );
};
