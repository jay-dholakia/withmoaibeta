
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createWorkoutCompletion, createOneOffWorkoutCompletion } from '@/services/workout-history-service';

interface StandaloneWorkout {
  id: string;
  title: string;
  description?: string;
  category?: string;
  workout_type?: string;
}

interface SelectStrengthWorkoutFormProps {
  onComplete: () => void;
  selectedDate?: Date;
}

const SelectStrengthWorkoutForm: React.FC<SelectStrengthWorkoutFormProps> = ({ 
  onComplete,
  selectedDate = new Date()
}) => {
  const { user } = useAuth();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: workouts, isLoading, error } = useQuery({
    queryKey: ['standalone-workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standalone_workouts')
        .select('*')
        .order('title');

      if (error) throw error;
      return data as StandaloneWorkout[];
    }
  });

  const handleWorkoutSelection = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
  };

  const handleSubmit = async () => {
    if (!selectedWorkoutId || !user?.id) {
      toast.error('Please select a workout');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedWorkout = workouts?.find(w => w.id === selectedWorkoutId);
      if (!selectedWorkout) {
        throw new Error('Selected workout not found');
      }
      
      // Create a workout completion with the selected date
      await createOneOffWorkoutCompletion({
        standalone_workout_id: selectedWorkoutId,
        title: selectedWorkout.title,
        description: selectedWorkout.description,
        workout_type: selectedWorkout.workout_type || 'strength',
        completed_at: selectedDate.toISOString()
      });

      toast.success('Workout logged successfully!');
      onComplete();
    } catch (error) {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading workouts</p>
      </div>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p>No workouts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className={`p-3 border rounded-md cursor-pointer transition-colors ${
              selectedWorkoutId === workout.id
                ? 'border-primary bg-primary/10'
                : 'hover:border-gray-400'
            }`}
            onClick={() => handleWorkoutSelection(workout.id)}
          >
            <h3 className="font-medium">{workout.title}</h3>
            {workout.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {workout.description}
              </p>
            )}
            {workout.category && (
              <div className="mt-2">
                <span className="inline-block text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {workout.category}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onComplete}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!selectedWorkoutId || isSubmitting}
          onClick={handleSubmit}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">Saving...</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            'Log Workout'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectStrengthWorkoutForm;
