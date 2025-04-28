
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RunTracking from '@/components/client/workout/RunTracking';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createOneOffWorkoutCompletion } from '@/services/workout-history-service';
import { toast } from 'sonner';

const LiveRunPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const runId = crypto.randomUUID();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleRunComplete = async (summary: {distance: number, duration: number, pace: number}) => {
    if (!user) return;
    
    try {
      setIsCompleting(true);
      
      // Format duration as HH:MM:SS
      const durationMinutes = Math.round(summary.duration);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = Math.floor(durationMinutes % 60);
      const seconds = Math.floor((durationMinutes * 60) % 60);
      const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Create workout completion record
      await createOneOffWorkoutCompletion({
        title: 'Live Run',
        description: 'Run tracked with GPS',
        workout_type: 'running',
        completed_at: new Date().toISOString(),
        notes: `Pace: ${summary.pace.toFixed(2)} min/mile`,
        distance: summary.distance.toString(),
        duration: formattedDuration,
        rating: 5
      });
      
      toast.success("Run saved successfully!");
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error saving run completion:', error);
      toast.error("Failed to save your run. Please try again.");
    } finally {
      setIsCompleting(false);
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
