
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RunningExerciseFormProps {
  distance: string;
  setDistance: (distance: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
}

export const RunningExerciseForm: React.FC<RunningExerciseFormProps> = ({
  distance,
  setDistance,
  duration,
  setDuration
}) => {
  // Helper function to format distance input
  const formatDistanceInput = (value: string): string => {
    // Allow only numbers and decimal point
    return value.replace(/[^\d.]/g, '');
  };

  // Helper function to format duration input as minutes
  const formatDurationInput = (value: string): string => {
    // Allow only numbers
    return value.replace(/[^\d]/g, '');
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="distance" className="text-center block">Distance (miles)</Label>
        <Input
          id="distance"
          type="text"
          inputMode="decimal"
          value={distance}
          onChange={(e) => setDistance(formatDistanceInput(e.target.value))}
          placeholder="3.1"
          className="w-full text-center"
        />
      </div>
      
      <div>
        <Label htmlFor="duration" className="text-center block">Duration (minutes)</Label>
        <Input
          id="duration"
          type="text"
          inputMode="numeric"
          value={duration}
          onChange={(e) => setDuration(formatDurationInput(e.target.value))}
          placeholder="30"
          className="w-full text-center"
        />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Enter total minutes (e.g., 30 for 30 minutes)
        </p>
      </div>
    </div>
  );
};
