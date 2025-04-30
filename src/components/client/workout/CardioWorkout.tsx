
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Timer, Ruler } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RunTracking from './RunTracking';
import { useState } from 'react';

interface CardioWorkoutProps {
  workoutId: string;
  formatDurationInput: (value: string) => string;
  onCardioChange: (exerciseId: string, field: 'distance' | 'duration' | 'location', value: string) => void;
  onCardioCompletion: (exerciseId: string, completed: boolean) => void;
  cardioData: {
    distance: string;
    duration: string;
    location: string;
    completed: boolean;
  };
  exerciseId: string;
  workoutTitle?: string;
}

const CardioWorkout: React.FC<CardioWorkoutProps> = ({
  workoutId,
  formatDurationInput,
  onCardioChange,
  onCardioCompletion,
  cardioData,
  exerciseId,
  workoutTitle
}) => {
  const [showTracking, setShowTracking] = useState(false);

  const handleRunComplete = (summary: {distance: number, duration: number, pace: number}) => {
    // Update the distance and duration fields with the summary data
    onCardioChange(exerciseId, 'distance', `${summary.distance}`);
    onCardioChange(exerciseId, 'duration', formatDurationInput(Math.round(summary.duration).toString()));
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        {workoutTitle || "Cardio Workout"}
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Distance (miles)</label>
          <div className="relative">
            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
            <Input 
              type="text" 
              inputMode="decimal"
              placeholder="3.1"
              value={cardioData?.distance || ''}
              onChange={(e) => onCardioChange(exerciseId, 'distance', e.target.value)}
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
              value={cardioData?.duration || ''}
              onChange={(e) => onCardioChange(exerciseId, 'duration', formatDurationInput(e.target.value))}
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
              value={cardioData?.location || ''}
              onChange={(e) => onCardioChange(exerciseId, 'location', e.target.value)}
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
                runId={exerciseId} 
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
                    id={`cardio-done-${exerciseId}`}
                    checked={cardioData?.completed}
                    onCheckedChange={(checked) => onCardioCompletion(exerciseId, checked === true)}
                    className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <label htmlFor={`cardio-done-${exerciseId}`} className="ml-2 cursor-pointer">
                    Mark as Done
                  </label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark this cardio session as completed</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default CardioWorkout;
