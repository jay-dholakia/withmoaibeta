
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Youtube } from 'lucide-react';
import { WorkoutExercise } from '@/types/workout';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  exercise: WorkoutExercise;
  exerciseState: any;
  formatDurationInput: (value: string) => string;
  onCardioChange: (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => void;
  onCardioCompletion: (exerciseId: string, completed: boolean) => void;
  onVideoClick: (url: string, name: string) => void;
}

export const CardioExercise: React.FC<Props> = ({
  exercise,
  exerciseState,
  formatDurationInput,
  onCardioChange,
  onCardioCompletion,
  onVideoClick
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
            onChange={(e) => onCardioChange(exercise.id, 'distance', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Duration (hh:mm:ss)</label>
          <Input 
            type="text"
            placeholder="00:30:00"
            value={exerciseState.cardioData?.duration || ''}
            onChange={(e) => onCardioChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1">Location (optional)</label>
        <Input 
          type="text" 
          placeholder="e.g., Gym"
          value={exerciseState.cardioData?.location || ''}
          onChange={(e) => onCardioChange(exercise.id, 'location', e.target.value)}
        />
      </div>
      <div className="flex justify-between items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Checkbox 
                  id={`cardio-done-${exercise.id}`}
                  checked={exerciseState.cardioData?.completed}
                  onCheckedChange={(checked) => onCardioCompletion(exercise.id, checked === true)}
                  className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <label htmlFor={`cardio-done-${exercise.id}`} className="ml-2 cursor-pointer">
                  Mark as Done
                </label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mark this cardio session as completed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {exercise.exercise?.youtube_link && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onVideoClick(exercise.exercise!.youtube_link!, exercise.exercise!.name)}
          >
            <Youtube className="h-4 w-4 mr-1" /> Demo
          </Button>
        )}
      </div>
    </div>
  );
};
