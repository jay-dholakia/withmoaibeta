
import { supabase } from '@/integrations/supabase/client';

export interface RunLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  run_id: string;
}

// Let's use the workout_set_completions table to store run tracking info
// This approach reuses existing database structures rather than requiring a new table
export const saveRunLocation = async (location: RunLocation & { user_id: string }) => {
  const { error } = await supabase
    .from('workout_set_completions')
    .insert({
      workout_exercise_id: location.run_id, // Using this as the run identifier
      user_id: location.user_id,
      location: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp
      }),
      completed: true
    });

  if (error) {
    console.error('Error saving run location:', error);
    throw error;
  }
};

export const getRunLocations = async (runId: string): Promise<RunLocation[]> => {
  const { data, error } = await supabase
    .from('workout_set_completions')
    .select('location, workout_exercise_id, created_at')
    .eq('workout_exercise_id', runId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching run locations:', error);
    throw error;
  }

  // Transform the data into the expected RunLocation format
  const locations: RunLocation[] = data
    .filter(item => item.location) // Filter out any entries without location data
    .map(item => {
      try {
        const locationData = typeof item.location === 'string' 
          ? JSON.parse(item.location) 
          : item.location;

        return {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp || item.created_at,
          run_id: item.workout_exercise_id
        };
      } catch (e) {
        console.error('Error parsing location data:', e);
        return null;
      }
    })
    .filter(Boolean) as RunLocation[];

  return locations;
};
