
import { supabase } from '@/integrations/supabase/client';

export interface RunLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  run_id: string;
}

export const saveRunLocation = async (location: RunLocation) => {
  const { error } = await supabase
    .from('run_tracking')
    .insert({
      run_id: location.run_id,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp
    });

  if (error) {
    console.error('Error saving run location:', error);
    throw error;
  }
};

export const getRunLocations = async (runId: string): Promise<RunLocation[]> => {
  const { data, error } = await supabase
    .from('run_tracking')
    .select('latitude, longitude, timestamp')
    .eq('run_id', runId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching run locations:', error);
    throw error;
  }

  return data || [];
};
