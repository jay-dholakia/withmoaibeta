
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RunningExerciseFormProps {
  distance: string;
  setDistance: (distance: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  location?: string;
  setLocation?: (location: string) => void;
  notes?: string;
  setNotes?: (notes: string) => void;
}

export const RunningExerciseForm: React.FC<RunningExerciseFormProps> = ({
  distance,
  setDistance,
  duration,
  setDuration,
  location = '',
  setLocation = () => {},
  notes = '',
  setNotes = () => {}
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
    <div className="space-y-4">
      <div className="flex items-center mb-2">
        <span role="img" aria-label="running" className="mr-2 text-lg">🏃</span>
        <span className="font-medium">Running Exercise</span>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="distance" className="text-left block">Distance (miles)</Label>
        <div className="relative">
          <span role="img" aria-label="ruler" className="absolute left-3 top-2.5 text-muted-foreground text-sm">📏</span>
          <Input
            id="distance"
            type="text"
            inputMode="decimal"
            value={distance}
            onChange={(e) => setDistance(formatDistanceInput(e.target.value))}
            placeholder="3.1"
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="duration" className="text-left block">Duration (minutes)</Label>
        <div className="relative">
          <span role="img" aria-label="timer" className="absolute left-3 top-2.5 text-muted-foreground text-sm">⏱️</span>
          <Input
            id="duration"
            type="text"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(formatDurationInput(e.target.value))}
            placeholder="30"
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enter total minutes (e.g., 30 for 30 minutes)
        </p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="location" className="text-left block">Location (optional)</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Select 
            value={location} 
            onValueChange={setLocation}
          >
            <SelectTrigger id="location" className="pl-10">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indoor">Indoor</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {setNotes && (
        <div className="grid gap-2">
          <Label htmlFor="notes" className="text-left block">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was your run?"
            className="min-h-[80px]"
          />
        </div>
      )}
    </div>
  );
};
