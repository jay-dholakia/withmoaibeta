import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarPlus, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

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

const SUPABASE_URL = "https://gjrheltyxjilxcphbzdj.supabase.co";

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
  const [eventLink, setEventLink] = useState<string | null>(null);
  const [isAddedToCalendar, setIsAddedToCalendar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('10:00');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const calendarStatus = searchParams.get('calendar');
    const errorMessage = searchParams.get('error');

    if (calendarStatus === 'connected') {
      toast.success('Google Calendar connected successfully!');
      setIsConnected(true);
      navigate(location.pathname, { replace: true });
    } else if (errorMessage) {
      toast.error(`Google Calendar error: ${errorMessage}`);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

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
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate Google authentication');
      }
      
      const result = await response.json();
      
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast.info('Please complete the Google authorization in the new tab');
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
      
      let scheduledDateTime: string | undefined;
      if (selectedDate) {
        const dateObj = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        dateObj.setHours(hours, minutes, 0, 0);
        scheduledDateTime = dateObj.toISOString();
      }
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/add-to-google-calendar`, {
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
          startTime: scheduledDateTime || startTime,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        if (result.event && result.event.htmlLink) {
          setEventLink(result.event.htmlLink);
          setIsAddedToCalendar(true);
        }
        
        toast.success('Workout added to Google Calendar', {
          action: {
            label: 'View Event',
            onClick: () => window.open(result.event.htmlLink, '_blank', 'noopener,noreferrer')
          }
        });
      } else {
        console.error('Error adding to calendar:', result);
        
        if (result.status === 403 && result.details && 
            (result.details.message?.includes('has not been used') || 
             result.details.message?.includes('is disabled'))) {
          toast.error(
            'The Google Calendar API needs to be enabled in your Google Cloud project. Please check the admin configuration.',
            { duration: 8000 }
          );
        } else if (result.error === 'Google Calendar not connected') {
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
      return;
    }
    
    if (isConnected) {
      if (isAddedToCalendar && eventLink) {
        window.open(eventLink, '_blank', 'noopener,noreferrer');
      } else if (!isAddedToCalendar) {
        setShowDatePicker(true);
      }
    } else {
      initiateGoogleAuth();
    }
  };

  const handleDateTimeSubmit = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    
    setShowDatePicker(false);
    addToCalendar();
  };

  return (
    <>
      <Button
        variant={isAddedToCalendar ? 'secondary' : variant}
        size="sm"
        className={`${className} ${isAddedToCalendar ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 dark:border-green-700' : ''}`}
        onClick={handleClick}
        disabled={disabled || isLoading || isConnected === null}
      >
        {isLoading ? (
          <>Loading...</>
        ) : isAddedToCalendar ? (
          <>
            <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-600" />
            Added to Calendar
          </>
        ) : eventLink ? (
          <>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View in Calendar
          </>
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
      
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Schedule Workout</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date" className="dark:text-gray-300">Date</Label>
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="p-3 pointer-events-auto"
                  disabled={(date) => date < new Date(Date.now() - 86400000)}
                  initialFocus
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time" className="dark:text-gray-300">Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 opacity-50 dark:text-gray-400" />
                <Input 
                  id="time" 
                  type="time" 
                  value={selectedTime} 
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              {selectedDate && (
                <p className="text-sm text-muted-foreground text-center dark:text-gray-400">
                  Scheduling "{title}" for {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDatePicker(false)}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDateTimeSubmit}
              className="dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Add to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
