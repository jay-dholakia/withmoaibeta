
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { fetchLatestCoachMessage, CoachMessage, markCoachMessageAsRead } from '@/services/coach-message-service';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { isFuture } from 'date-fns';

interface CoachMessageCardProps {
  userId: string;
}

export const CoachMessageCard: React.FC<CoachMessageCardProps> = ({ userId }) => {
  const [message, setMessage] = useState<CoachMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [programWeek, setProgramWeek] = useState<number | null>(null);

  // Calculate which program week the message corresponds to
  const calculateProgramWeek = async (messageDateStr: string) => {
    try {
      const messageDate = new Date(messageDateStr);
      // Fetch the user's assigned program
      const { data, error } = await supabase
        .from('program_assignments')
        .select('start_date')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching program assignment:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const startDate = new Date(data[0].start_date);
        
        // If program hasn't started yet, return Week 0
        if (isFuture(startDate)) {
          setProgramWeek(0);
          return 0;
        }
        
        // If message is before program start
        if (messageDate < startDate) {
          setProgramWeek(0);
          return 0;
        }
        
        // Calculate the difference in weeks
        const diffTime = messageDate.getTime() - startDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        const weekNumber = Math.floor(diffDays / 7) + 1; // +1 because we're in the first week when we start
        
        setProgramWeek(weekNumber);
        return weekNumber;
      }
      
      // No program assigned
      setProgramWeek(0);
      return 0;
    } catch (error) {
      console.error('Error calculating program week:', error);
      setProgramWeek(0);
      return 0;
    }
  };

  useEffect(() => {
    const loadMessage = async () => {
      if (!userId) return;
      
      setLoading(true);
      const coachMessage = await fetchLatestCoachMessage(userId);
      setMessage(coachMessage);
      
      // Calculate program week if we have a message
      if (coachMessage) {
        await calculateProgramWeek(coachMessage.week_of);
        
        // Mark the message as read if not already read
        if (!coachMessage.read_by_client) {
          await markCoachMessageAsRead(coachMessage.id);
        }
      }
      
      setLoading(false);
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
          {programWeek !== null ? `Week ${programWeek}` : 'Week 0'} 
          {' '}(week of {new Date(message.week_of).toLocaleDateString()})
        </p>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-4 border-client pl-4 italic text-left">
          "{message.message}"
        </blockquote>
      </CardContent>
    </Card>
  );
};
