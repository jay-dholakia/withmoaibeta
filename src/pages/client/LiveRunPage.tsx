
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RunTracking from '@/components/client/workout/RunTracking';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const LiveRunPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const runId = crypto.randomUUID();

  const handleRunComplete = async (summary: {distance: number, duration: number, pace: number}) => {
    try {
      // Log the completed run to workout_completions
      if (user?.id) {
        await supabase
          .from('workout_completions')
          .insert({
            user_id: user.id,
            title: `${summary.distance.toFixed(2)} mile Run`,
            description: `Completed at ${summary.pace.toFixed(2)} min/mile pace`,
            workout_type: 'live_run', // Changed from 'running' to 'live_run'
            distance: summary.distance.toFixed(2),
            duration: summary.duration.toString(),
            location: 'Outdoor Run'
          });
        
        toast.success('Run completed and saved to your workout history');
      }
      
      // Navigate back to workouts page
      navigate('/client-dashboard/workouts');
      
      // Refresh the workout history
      document.getElementById('refresh-workout-history')?.click();
    } catch (error) {
      console.error('Error saving run completion:', error);
      toast.error('Failed to save your run data');
      navigate('/client-dashboard/workouts');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/client-dashboard/workouts')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Live Run Tracking</h1>
      </div>

      <RunTracking 
        runId={runId} 
        onRunComplete={handleRunComplete}
      />
    </div>
  );
};

export default LiveRunPage;
