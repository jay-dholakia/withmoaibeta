
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin } from 'lucide-react';
import { ExerciseState } from '@/types/active-workout';

interface RunExerciseProps {
  workoutExerciseId: string;
  exerciseState: ExerciseState;
  onValueChange: (field: 'distance' | 'duration' | 'location', value: string) => void;
  onToggleComplete: () => void;
}

export const RunExercise: React.FC<RunExerciseProps> = ({
  workoutExerciseId,
  exerciseState,
  onValueChange,
  onToggleComplete
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1">Distance</label>
          <Input 
            type="text" 
            placeholder="e.g., 5 miles"
            value={exerciseState.runData?.distance || ''}
            onChange={(e) => onValueChange('distance', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Duration (hh:mm:ss)</label>
          <Input 
            type="text"
            placeholder="00:30:00"
            value={exerciseState.runData?.duration || ''}
            onChange={(e) => onValueChange('duration', e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-xs mb-1">Location (optional)</label>
        <div className="relative">
          <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="e.g., City Park Trail"
            value={exerciseState.runData?.location || ''}
            onChange={(e) => onValueChange('location', e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Checkbox 
            id={`run-done-${workoutExerciseId}`}
            checked={exerciseState.runData?.completed || false}
            onCheckedChange={() => onToggleComplete()}
            className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
          />
          <label htmlFor={`run-done-${workoutExerciseId}`} className="ml-2 cursor-pointer">
            Mark as Done
          </label>
        </div>
      </div>
    </div>
  );
};
