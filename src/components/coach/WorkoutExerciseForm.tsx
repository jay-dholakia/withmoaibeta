
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Clock, Ruler } from 'lucide-react';

export interface WorkoutExerciseFormProps {
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export const WorkoutExerciseForm: React.FC<WorkoutExerciseFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false
}) => {
  const [sets, setSets] = useState(initialData?.sets || 3);
  const [reps, setReps] = useState(initialData?.reps || '10');
  const [restSeconds, setRestSeconds] = useState(initialData?.rest_seconds || 60);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [distance, setDistance] = useState(initialData?.distance || '');
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [location, setLocation] = useState(initialData?.location || '');

  const logType = initialData?.exercise?.log_type || 'weight_reps';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: any = {
      sets: sets,
      reps: reps,
      rest_seconds: restSeconds,
      notes: notes
    };

    // Add additional fields based on log type
    if (logType === 'duration_distance') {
      formData.distance = distance;
      formData.duration = duration;
      formData.location = location;
    }
    
    onSubmit(formData);
  };

  const formatDurationInput = (value: string): string => {
    let cleaned = value.replace(/[^\d:]/g, '');
    
    const parts = cleaned.split(':');
    
    if (parts.length > 3) {
      cleaned = parts.slice(0, 3).join(':');
    }
    
    return cleaned;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-center">
      {logType === 'weight_reps' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sets" className="text-center block">Sets</Label>
            <Input
              id="sets"
              type="number"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              min={1}
              className="w-full text-center"
            />
          </div>
          <div>
            <Label htmlFor="reps" className="text-center block">Reps/Duration</Label>
            <Input
              id="reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="e.g., 10 or 30s"
              className="w-full text-center"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              For strength exercises, use just numbers (e.g., "10") to auto-populate client tracking
            </p>
          </div>
        </div>
      )}

      {logType === 'duration' && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="sets" className="text-center block">Sets</Label>
            <Input
              id="sets"
              type="number"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              min={1}
              className="w-full text-center"
            />
          </div>
          <div>
            <Label htmlFor="reps" className="text-center block">Duration</Label>
            <Input
              id="reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="e.g., 30s, 2m, etc."
              className="w-full text-center"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Enter time as 30s, 1m, 2m30s, etc.
            </p>
          </div>
        </div>
      )}

      {logType === 'duration_distance' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sets" className="text-center block">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                min={1}
                className="w-full text-center"
              />
            </div>
            <div>
              <div className="flex items-center justify-center mb-1">
                <Ruler className="h-4 w-4 mr-1 text-muted-foreground" />
                <Label htmlFor="distance" className="text-center">Distance (miles)</Label>
              </div>
              <Input
                id="distance"
                type="number"
                step="0.01"
                min="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="0.00"
                className="w-full text-center"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <Label htmlFor="duration" className="text-center">Duration (hh:mm:ss)</Label>
            </div>
            <Input
              id="duration"
              placeholder="00:00:00"
              value={duration}
              onChange={(e) => setDuration(formatDurationInput(e.target.value))}
              className="w-full text-center"
            />
          </div>
          
          <div>
            <Label htmlFor="location" className="text-center block">Location</Label>
            <ToggleGroup 
              type="single" 
              className="justify-center"
              value={location}
              onValueChange={(value) => {
                if (value) setLocation(value);
              }}
            >
              <ToggleGroupItem 
                value="indoor" 
                className="text-sm border border-gray-300 hover:border-primary data-[state=on]:border-primary"
              >
                Indoor
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="outdoor" 
                className="text-sm border border-gray-300 hover:border-primary data-[state=on]:border-primary"
              >
                Outdoor
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}
      
      <div>
        <Label htmlFor="rest" className="text-center block">Rest (seconds)</Label>
        <Input
          id="rest"
          type="number"
          value={restSeconds}
          onChange={(e) => setRestSeconds(Number(e.target.value))}
          min={0}
          className="w-full text-center"
        />
      </div>
      
      <div>
        <Label htmlFor="notes" className="text-center block">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add special instructions or cues"
          rows={2}
          className="min-h-[60px] text-center"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
