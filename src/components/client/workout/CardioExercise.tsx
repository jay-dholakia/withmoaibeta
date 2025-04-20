
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ExerciseState } from '@/types/active-workout';

interface CardioExerciseProps {
  workoutExerciseId: string;
  exerciseState: ExerciseState;
  onValueChange: (field: 'distance' | 'duration' | 'location', value: string) => void;
  onToggleComplete: () => void;
}

export const CardioExercise: React.FC<CardioExerciseProps> = ({
  workoutExerciseId,
  exerciseState,
  onValueChange,
  onToggleComplete
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1">Distance (optional)</label>
          <Input 
            type="text" 
            placeholder="e.g., 5 miles"
            value={exerciseState.cardioData?.distance || ''}
            onChange={(e) => onValueChange('distance', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Duration (hh:mm:ss)</label>
          <Input 
            type="text"
            placeholder="00:30:00"
            value={exerciseState.cardioData?.duration || ''}
            onChange={(e) => onValueChange('duration', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1">Location (optional)</label>
        <Input 
          type="text" 
          placeholder="e.g., Gym"
          value={exerciseState.cardioData?.location || ''}
          onChange={(e) => onValueChange('location', e.target.value)}
        />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Checkbox 
            id={`cardio-done-${workoutExerciseId}`}
            checked={exerciseState.cardioData?.completed || false}
            onCheckedChange={() => onToggleComplete()}
            className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
          />
          <label htmlFor={`cardio-done-${workoutExerciseId}`} className="ml-2 cursor-pointer">
            Mark as Done
          </label>
        </div>
      </div>
    </div>
  );
};
