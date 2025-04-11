
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddToGoogleCalendarButtonProps {
  workoutId: string;
  title: string;
  description?: string;
  dayOfWeek?: number;
  startTime?: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  disabled?: boolean;
}

export const AddToGoogleCalendarButton: React.FC<AddToGoogleCalendarButtonProps> = ({
  workoutId,
  title,
  description,
  dayOfWeek,
  startTime,
  className,
  variant = 'outline',
  disabled = false,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkGoogleCalendarConnection = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('google_calendar_tokens')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        setIsConnected(!!data);
      } catch (error) {
        console.error('Error checking Google Calendar connection:', error);
        setIsConnected(false);
      }
    };
    
    checkGoogleCalendarConnection();
  }, [user?.id]);

  const initiateGoogleAuth = async () => {
    if (!user) {
      toast.error('You must be logged in to connect your Google Calendar');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Authentication session expired');
        return;
      }
      
      const response = await fetch(`https://gjrheltyxjilxcphbzdj.supabase.co/functions/v1/google-calendar-auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error('Failed to initiate Google authentication');
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCalendar = async () => {
    if (!user) {
      toast.error('You must be logged in to add workouts to your calendar');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Authentication session expired');
        return;
      }
      
      const response = await fetch(`https://gjrheltyxjilxcphbzdj.supabase.co/functions/v1/add-to-google-calendar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutId,
          title,
          description,
          dayOfWeek,
          startTime,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Workout added to Google Calendar');
      } else {
        console.error('Error adding to calendar:', result.error);
        if (result.error === 'Google Calendar not connected') {
          setIsConnected(false);
          toast.error('Please connect your Google Calendar first', {
            action: {
              label: 'Connect',
              onClick: initiateGoogleAuth,
            },
          });
        } else {
          toast.error(result.error || 'Failed to add workout to calendar');
        }
      }
    } catch (error) {
      console.error('Error adding workout to calendar:', error);
      toast.error('Failed to add workout to calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (isConnected === null) {
      // Still checking
      return;
    }
    
    if (isConnected) {
      addToCalendar();
    } else {
      initiateGoogleAuth();
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading || isConnected === null}
    >
      {isLoading ? (
        <>Loading...</>
      ) : isConnected ? (
        <>
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          Add to Calendar
        </>
      ) : (
        <>
          <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
          Connect Calendar
        </>
      )}
    </Button>
  );
};
