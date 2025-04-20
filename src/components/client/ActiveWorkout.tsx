
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from 'lucide-react';
import Stopwatch from '@/components/client/Stopwatch';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { toast } from 'sonner';

const ActiveWorkout: React.FC = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { triggerAutosave } = useWorkoutState([]);

  // Mock saveAllSetsMutation for now since we don't have its implementation
  const saveAllSetsMutation = useMutation({
    mutationFn: async () => {
      // Trigger autosave before completing the workout
      triggerAutosave();
      
      // This would be implemented with actual API calls to save workout data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Workout completed successfully!');
      return true;
    }
  });

  return (
    <div className="pb-24">
      {/* Main workout content would go here */}
      <div className="min-h-[300px] flex items-center justify-center text-center p-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Active Workout</h2>
          <p className="text-gray-500">Workout ID: {workoutCompletionId}</p>
        </div>
      </div>
      
      <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-background pb-2 pt-2 z-10 border-t border-gray-200">
        <div className="container max-w-3xl px-4">
          <div className="flex justify-center items-center mb-2">
            <Stopwatch />
          </div>
        
          <Button 
            variant="default" 
            size="lg" 
            onClick={() => saveAllSetsMutation.mutate()} 
            disabled={saveAllSetsMutation.isPending}
            className="w-full text-lg flex items-center"
          >
            {saveAllSetsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" /> Complete Workout
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkout;
