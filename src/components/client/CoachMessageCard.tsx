
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

  const calculateProgramWeek = async (messageDateStr: string) => {
    try {
      const messageDate = new Date(messageDateStr);
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
        
        if (isFuture(startDate)) {
          setProgramWeek(0);
          return 0;
        }
        
        if (messageDate < startDate) {
          setProgramWeek(0);
          return 0;
        }
        
        const diffTime = messageDate.getTime() - startDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        const weekNumber = Math.floor(diffDays / 7) + 1;
        
        setProgramWeek(weekNumber);
        return weekNumber;
      }
      
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
      
      if (coachMessage) {
        await calculateProgramWeek(coachMessage.week_of);
        
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
      <Card className="mb-6 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-2/3 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full dark:bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  if (!message) {
    return (
      <Card className="mb-6 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground dark:text-gray-400">
            <MessageSquare className="h-8 w-8 mb-2 opacity-60" />
            <p>No messages from your coach yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 shadow-lg dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-medium dark:text-gray-100">
          Message from Coach {message.coach_first_name || 'Your Coach'}
        </h3>
        <p className="text-sm text-muted-foreground dark:text-gray-400">
          {programWeek !== null ? `Week ${programWeek}` : 'Week 0'} 
          {' '}(week of {new Date(message.week_of).toLocaleDateString()})
        </p>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-4 border-client dark:border-blue-500 pl-4 italic text-left dark:text-gray-200">
          "{message.message}"
        </blockquote>
      </CardContent>
    </Card>
  );
};
