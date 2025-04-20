
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Youtube, MapPin } from 'lucide-react';
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
  onRunChange: (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => void;
  onRunCompletion: (exerciseId: string, completed: boolean) => void;
  onVideoClick: (url: string, name: string) => void;
}

export const RunExercise: React.FC<Props> = ({
  exercise,
  exerciseState,
  formatDurationInput,
  onRunChange,
  onRunCompletion,
  onVideoClick
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
            onChange={(e) => onRunChange(exercise.id, 'distance', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Duration (hh:mm:ss)</label>
          <Input 
            type="text"
            placeholder="00:30:00"
            value={exerciseState.runData?.duration || ''}
            onChange={(e) => onRunChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
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
            onChange={(e) => onRunChange(exercise.id, 'location', e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Checkbox 
                  id={`run-done-${exercise.id}`}
                  checked={exerciseState.runData?.completed}
                  onCheckedChange={(checked) => onRunCompletion(exercise.id, checked === true)}
                  className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <label htmlFor={`run-done-${exercise.id}`} className="ml-2 cursor-pointer">
                  Mark as Done
                </label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mark this run as completed</p>
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
