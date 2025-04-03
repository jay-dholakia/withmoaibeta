
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";

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
  const [sets, setSets] = React.useState(initialData?.sets || 1);
  const [reps, setReps] = React.useState(initialData?.reps || '');
  const [restSeconds, setRestSeconds] = React.useState(initialData?.rest_seconds || 45);
  const [notes, setNotes] = React.useState(initialData?.notes || '');
  const [duration, setDuration] = React.useState(initialData?.duration || '');
  const [distance, setDistance] = React.useState(initialData?.distance || '');
  
  // Generate a unique storage key based on exercise ID
  const getStorageKey = () => {
    if (!initialData?.id) return null;
    return `workout_exercise_form_${initialData.id}`;
  };
  
  // Save form data to localStorage
  const saveFormToLocalStorage = () => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    const formData = {
      sets,
      reps,
      restSeconds,
      notes,
      duration,
      distance
    };
    
    localStorage.setItem(storageKey, JSON.stringify(formData));
  };
  
  // Load form data from localStorage
  const loadFormFromLocalStorage = () => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    const savedData = localStorage.getItem(storageKey);
    if (!savedData) return;
    
    try {
      const formData = JSON.parse(savedData);
      
      if (formData.sets) setSets(formData.sets);
      if (formData.reps) setReps(formData.reps);
      if (formData.restSeconds) setRestSeconds(formData.restSeconds);
      if (formData.notes) setNotes(formData.notes);
      if (formData.duration) setDuration(formData.duration);
      if (formData.distance) setDistance(formData.distance);
    } catch (error) {
      console.error("Error parsing saved form data:", error);
    }
  };
  
  // Clear form data from localStorage
  const clearFormFromLocalStorage = () => {
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };
  
  // Load saved data on initial render
  useEffect(() => {
    loadFormFromLocalStorage();
  }, [initialData?.id]);
  
  // Auto-save form data when values change
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      saveFormToLocalStorage();
    }, 500);
    
    return () => clearTimeout(debounceTimeout);
  }, [sets, reps, restSeconds, notes, duration, distance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      sets,
      reps: isRunningExercise ? '' : reps,
      rest_seconds: restSeconds,
      notes,
      duration,
      distance
    }).then(() => {
      // Clear saved data after successful submission
      clearFormFromLocalStorage();
    });
  };

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

  // Determine if this is a running exercise based on the exercise type or name
  const isRunningExercise = React.useMemo(() => {
    if (!initialData?.exercise) return false;
    
    const exerciseName = initialData.exercise.name?.toLowerCase() || '';
    const exerciseType = initialData.exercise.exercise_type?.toLowerCase() || '';
    
    return exerciseName.includes('run') || 
           exerciseName.includes('jog') || 
           exerciseType.includes('run') ||
           exerciseType.includes('cardio');
  }, [initialData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-center">
      {!isRunningExercise ? (
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
      ) : (
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
      )}
      
      {!isRunningExercise && (
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
      )}
      
      <div>
        <Label htmlFor="notes" className="text-center block">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add special instructions or cues"
          rows={2}
          className="min-h-[60px] text-center"
          autoSave={true}
          storageKey={getStorageKey() || undefined}
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
