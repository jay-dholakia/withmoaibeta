
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
  // Helper function to format duration input
  const formatDurationInput = (value: string): string => {
    let cleaned = value.replace(/[^\d:]/g, '');
    
    // Limit to maximum of 3 parts (hours:minutes:seconds)
    const parts = cleaned.split(':');
    if (parts.length > 3) {
      cleaned = parts.slice(0, 3).join(':');
    }
    
    return cleaned;
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="distance" className="text-center block">Distance (miles)</Label>
        <Input
          id="distance"
          type="number"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="3.1"
          step="0.1"
          min="0"
          className="w-full text-center"
        />
      </div>
      
      <div>
        <Label htmlFor="duration" className="text-center block">Duration (hh:mm:ss)</Label>
        <Input
          id="duration"
          value={duration}
          onChange={(e) => setDuration(formatDurationInput(e.target.value))}
          placeholder="00:30:00"
          className="w-full text-center"
        />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Format as hours:minutes:seconds (e.g., 00:30:00 for 30 minutes)
        </p>
      </div>
    </div>
  );
};
