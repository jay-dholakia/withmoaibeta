
import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import Stopwatch from '@/components/client/Stopwatch';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkoutState } from '@/hooks/useWorkoutState';

interface ActiveWorkoutProps {
  // Removing the key prop from the interface as it shouldn't be accessed directly
  // React handles the key prop specially
}

const ActiveWorkout: React.FC<ActiveWorkoutProps> = () => {
  const { workoutCompletionId } = useParams();
  
  console.log('ActiveWorkout: Rendering with workoutCompletionId:', workoutCompletionId);
  
  // This is a placeholder for the actual mutation - replace with your actual implementation
  const saveAllSetsMutation = useMutation({
    mutationFn: async () => {
      // Implement your mutation logic here
      console.log('Saving workout completion', workoutCompletionId);
      return Promise.resolve(true);
    },
    onSuccess: () => {
      toast.success('Workout completed successfully!');
      // Add any additional success handling here
    },
    onError: (error) => {
      toast.error('Failed to complete workout');
      console.error('Error completing workout:', error);
    }
  });

  return (
    <div className="pb-32">
      <div className="container max-w-3xl pt-4">
        <h1 className="text-2xl font-bold mb-4">Active Workout</h1>
        <p className="mb-6">Workout ID: {workoutCompletionId}</p>
        
        {/* Your active workout content goes here */}
      </div>
      
      {/* Fixed bottom bar with timer and complete button */}
      <div className="fixed bottom-[7.5rem] left-0 right-0 bg-white dark:bg-background pb-2 pt-2 z-10 shadow-md">
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
