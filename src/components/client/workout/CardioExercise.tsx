
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Youtube, MapPin, Timer, Ruler } from 'lucide-react';
import { WorkoutExercise } from '@/types/workout';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RunTracking from './RunTracking';

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
  const [showTracking, setShowTracking] = useState(false);
  
  const handleRunComplete = (summary: {distance: number, duration: number, pace: number}) => {
    // Update the distance and duration fields with the summary data
    onCardioChange(exercise.id, 'distance', `${summary.distance}`);
    onCardioChange(exercise.id, 'duration', formatDurationInput(Math.round(summary.duration).toString()));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Distance (miles)</label>
        <div className="relative">
          <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
          <Input 
            type="text" 
            inputMode="decimal"
            placeholder="3.1"
            value={exerciseState.cardioData?.distance || ''}
            onChange={(e) => onCardioChange(exercise.id, 'distance', e.target.value)}
            className="pl-10 h-12 rounded-md"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
        <div className="relative">
          <Timer className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
          <Input 
            type="text"
            inputMode="numeric"
            placeholder="30"
            value={exerciseState.cardioData?.duration || ''}
            onChange={(e) => onCardioChange(exercise.id, 'duration', formatDurationInput(e.target.value))}
            className="pl-10 h-12 rounded-md"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Location (optional)</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
          <Input 
            type="text" 
            placeholder="Park, trail, neighborhood, etc."
            value={exerciseState.cardioData?.location || ''}
            onChange={(e) => onCardioChange(exercise.id, 'location', e.target.value)}
            className="pl-10 h-12 rounded-md"
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowTracking(!showTracking)}
          className="flex items-center gap-2"
        >
          {showTracking ? "Hide GPS Tracking" : "Show GPS Tracking"}
        </Button>
        
        {showTracking && (
          <div className="mt-2">
            <RunTracking 
              runId={exercise.id} 
              onRunComplete={handleRunComplete}
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center pt-2">
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
