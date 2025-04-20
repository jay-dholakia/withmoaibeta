
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ExerciseState } from '@/types/active-workout';

interface FlexibilityExerciseProps {
  workoutExerciseId: string;
  exerciseState: ExerciseState;
  onValueChange: (value: string) => void;
  onToggleComplete: () => void;
}

export const FlexibilityExercise: React.FC<FlexibilityExerciseProps> = ({
  workoutExerciseId,
  exerciseState,
  onValueChange,
  onToggleComplete
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs mb-1">Duration (hh:mm:ss)</label>
        <Input 
          type="text"
          placeholder="00:30:00"
          value={exerciseState.flexibilityData?.duration || ''}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Checkbox 
            id={`flexibility-done-${workoutExerciseId}`}
            checked={exerciseState.flexibilityData?.completed || false}
            onCheckedChange={() => onToggleComplete()}
            className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
          />
          <label htmlFor={`flexibility-done-${workoutExerciseId}`} className="ml-2 cursor-pointer">
            Mark as Done
          </label>
        </div>
      </div>
    </div>
  );
};
