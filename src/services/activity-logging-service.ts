
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RunLog {
  log_date: Date;
  distance: number;
  duration: number;
  location?: string;
  notes?: string;
  workout_type: string;
}

export interface CardioLog {
  log_date: Date;
  activity_type: string;
  duration: number;
  notes?: string;
  workout_type: string;
}

export interface RestDayLog {
  log_date: Date;
  notes?: string;
  workout_type: string;
}

export interface SetHistory {
  set_number: number;
  reps: string;
  weight: string;
}

// Add these missing functions for WorkoutHistoryTab.tsx
export async function getClientRunActivities(startDate: Date, endDate: Date): Promise<RunLog[]> {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('workout_type', 'running')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching run activities:', error);
      return [];
    }
    
    return data.map(item => ({
      log_date: new Date(item.completed_at),
      distance: parseFloat(item.distance || '0'),
      duration: parseInt(item.duration || '0', 10),
      location: item.location || '',
      notes: item.notes || '',
      workout_type: item.workout_type || 'running'
    }));
  } catch (error) {
    console.error('Error in getClientRunActivities:', error);
    return [];
  }
}

export async function getClientCardioActivities(startDate: Date, endDate: Date): Promise<CardioLog[]> {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('workout_type', 'cardio')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching cardio activities:', error);
      return [];
    }
    
    return data.map(item => ({
      log_date: new Date(item.completed_at),
      activity_type: item.title || 'Cardio',
      duration: parseInt(item.duration || '0', 10),
      notes: item.notes || '',
      workout_type: item.workout_type || 'cardio'
    }));
  } catch (error) {
    console.error('Error in getClientCardioActivities:', error);
    return [];
  }
}

export async function getClientRestDays(startDate: Date, endDate: Date): Promise<RestDayLog[]> {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('workout_type', 'rest_day')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching rest days:', error);
      return [];
    }
    
    return data.map(item => ({
      log_date: new Date(item.completed_at),
      notes: item.notes || '',
      workout_type: 'rest_day'
    }));
  } catch (error) {
    console.error('Error in getClientRestDays:', error);
    return [];
  }
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
          notes: restData.notes || '',
          workout_type: restData.workout_type || 'rest_day'
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

/**
 * Get previous set completions for a specific exercise and user
 * @param exerciseId The ID of the exercise
 * @param userId The ID of the user
 * @returns Array of set history objects with set number, reps, and weight
 */
export async function getPreviousSetCompletions(exerciseId: string): Promise<SetHistory[]> {
  try {
    // First, get the workout exercise IDs that correspond to this exercise
    const { data: workoutExercises, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('id')
      .eq('exercise_id', exerciseId);

    if (exerciseError || !workoutExercises || workoutExercises.length === 0) {
      console.log('No workout exercises found for exercise ID:', exerciseId);
      return [];
    }

    const workoutExerciseIds = workoutExercises.map(we => we.id);

    // Then query for the most recent set completions for each set number
    const { data: setCompletions, error } = await supabase
      .from('workout_set_completions')
      .select('set_number, weight, reps_completed, completed_at')
      .in('workout_exercise_id', workoutExerciseIds)
      .eq('completed', true)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching previous set completions:', error);
      return [];
    }

    if (!setCompletions || setCompletions.length === 0) {
      console.log('No previous set completions found');
      return [];
    }

    // Group by set number and take the most recent for each
    const setMap = new Map<number, SetHistory>();
    
    setCompletions.forEach(set => {
      const setNumber = set.set_number;
      
      if (!setMap.has(setNumber)) {
        setMap.set(setNumber, {
          set_number: setNumber,
          reps: set.reps_completed?.toString() || '',
          weight: set.weight?.toString() || ''
        });
      }
    });

    // Convert map to array
    return Array.from(setMap.values());
  } catch (error) {
    console.error('Error in getPreviousSetCompletions:', error);
    return [];
  }
}
