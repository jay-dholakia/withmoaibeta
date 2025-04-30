
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
  onFlexibilityChange: (exerciseId: string, field: 'duration', value: string) => void;
  onFlexibilityCompletion: (exerciseId: string, completed: boolean) => void;
  onVideoClick: (url: string, name: string) => void;
}

export const FlexibilityExercise: React.FC<Props> = ({
  exercise,
  exerciseState,
  formatDurationInput,
  onFlexibilityChange,
  onFlexibilityCompletion,
  onVideoClick
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs mb-1">Duration (hh:mm:ss)</label>
        <Input 
          type="text"
          placeholder="00:30:00"
          value={exerciseState.flexibilityData?.duration || ''}
          onChange={(e) => onFlexibilityChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Checkbox 
                  id={`flexibility-done-${exercise.id}`}
                  checked={exerciseState.flexibilityData?.completed}
                  onCheckedChange={(checked) => onFlexibilityCompletion(exercise.id, checked === true)}
                  className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <label htmlFor={`flexibility-done-${exercise.id}`} className="ml-2 cursor-pointer">
                  Mark as Done
                </label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mark this flexibility exercise as completed</p>
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
