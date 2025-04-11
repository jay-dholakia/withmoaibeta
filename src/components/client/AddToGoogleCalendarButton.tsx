
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AddToGoogleCalendarButtonProps {
  workoutId: string;
  title: string;
  description?: string;
  startDate?: Date | null;
  duration?: number;
}

export const AddToGoogleCalendarButton: React.FC<AddToGoogleCalendarButtonProps> = ({
  workoutId,
  title,
  description = '',
  startDate = new Date(),
  duration = 60,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const handleAddToCalendar = async () => {
    if (!user) {
      toast.error('You must be logged in to add to calendar');
      return;
    }
    
    setIsLoading(true);
    try {
      // Calculate end time (default 1 hour)
      const endDate = new Date(startDate || new Date());
      endDate.setMinutes(endDate.getMinutes() + (duration || 60));
      
      const eventData = {
        workoutId,
        title: `Workout: ${title}`,
        description: description || 'Scheduled workout session',
        start: startDate?.toISOString() || new Date().toISOString(),
        end: endDate.toISOString(),
        userId: user.id
      };
      
      // Call our edge function to create the event
      const { data, error } = await supabase.functions.invoke('add-to-google-calendar', {
        body: eventData
      });
      
      if (error) throw error;
      
      if (data.authUrl) {
        // If we need authorization, redirect to Google OAuth
        window.location.href = data.authUrl;
        return;
      }
      
      if (data.success) {
        toast.success('Workout added to Google Calendar!');
      } else {
        throw new Error(data.message || 'Failed to add workout to calendar');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error('Failed to add workout to Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleAddToCalendar} 
      size="sm" 
      variant="outline"
      className="flex items-center gap-1 text-xs"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        <Calendar className="h-3 w-3 mr-1" />
      )}
      Add to Calendar
    </Button>
  );
};
