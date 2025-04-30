
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RunLog {
  log_date: Date;
  distance: number;
  duration: number;
  location?: string;
  notes?: string;
  workout_type: string; // Add this property
}

export interface CardioLog {
  log_date: Date;
  activity_type: string;
  duration: number;
  notes?: string;
  workout_type: string; // Add this property
}

export interface RestDayLog {
  log_date: Date;
  notes?: string;
}

export async function logRunActivity(runData: RunLog): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('log_activity', {
      body: {
        activity_type: 'run',
        activity_data: {
          date: runData.log_date,
          distance: runData.distance,
          duration: runData.duration,
          location: runData.location || '',
          notes: runData.notes || '',
          workout_type: runData.workout_type || 'running'
        }
      }
    });
    
    if (error) {
      console.error('Error logging run activity:', error);
      toast.error('Failed to log your run');
      return false;
    }
    
    toast.success('Run activity logged successfully!');
    return true;
  } catch (error) {
    console.error('Error logging run activity:', error);
    toast.error('There was a problem logging your run');
    return false;
  }
}

export async function logCardioActivity(cardioData: CardioLog): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('log_activity', {
      body: {
        activity_type: 'cardio',
        activity_data: {
          date: cardioData.log_date,
          activity_type: cardioData.activity_type,
          duration: cardioData.duration,
          notes: cardioData.notes || '',
          workout_type: cardioData.workout_type || 'cardio'
        }
      }
    });
    
    if (error) {
      console.error('Error logging cardio activity:', error);
      toast.error('Failed to log your cardio activity');
      return false;
    }
    
    toast.success('Cardio activity logged successfully!');
    return true;
  } catch (error) {
    console.error('Error logging cardio activity:', error);
    toast.error('There was a problem logging your cardio activity');
    return false;
  }
}

export async function logRestDay(restData: RestDayLog): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('log_activity', {
      body: {
        activity_type: 'rest',
        activity_data: {
          date: restData.log_date,
          notes: restData.notes || ''
        }
      }
    });
    
    if (error) {
      console.error('Error logging rest day:', error);
      toast.error('Failed to log your rest day');
      return false;
    }
    
    toast.success('Rest day logged successfully!');
    return true;
  } catch (error) {
    console.error('Error logging rest day:', error);
    toast.error('There was a problem logging your rest day');
    return false;
  }
}
