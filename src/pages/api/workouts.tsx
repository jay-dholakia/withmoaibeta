
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { Workout } from '@/types/workout';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Since we're using Supabase directly in the client for now, we'll implement a simple proxy
  if (req.method === 'POST') {
    try {
      const workoutData = req.body;
      
      const { data, error } = await supabase
        .from('workouts')
        .insert(workoutData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return res.status(201).json(data);
    } catch (error: any) {
      console.error('Error creating workout:', error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
