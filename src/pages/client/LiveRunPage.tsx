
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RunTracking from '@/components/client/workout/RunTracking';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LiveRunPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const runId = crypto.randomUUID();

  const handleRunComplete = (summary: {distance: number, duration: number, pace: number}) => {
    // Handle run completion
    navigate('/client-dashboard/workouts');
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
