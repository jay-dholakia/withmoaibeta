
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { saveWorkoutDraft, getWorkoutDraft, deleteWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

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

  // Create unique draft ID for this exercise form
  const exerciseFormDraftId = initialData?.id ? `exercise-form-${initialData.id}` : null;

  // Data object for autosave
  const draftData = {
    sets,
    reps,
    restSeconds,
    notes,
    duration,
    distance
  };

  // Use autosave hook when we have a valid exercise ID
  const { saveStatus } = useAutosave({
    data: draftData,
    onSave: async (data) => {
      if (!exerciseFormDraftId) return false;
      console.log("Autosaving exercise form data:", data);
      return await saveWorkoutDraft(
        exerciseFormDraftId,
        'exercise_form',
        data
      );
    },
    interval: 1000, // Reduced interval for more frequent saves
    disabled: !exerciseFormDraftId
  });

  // Load draft data when component mounts
  useEffect(() => {
    const loadDraftData = async () => {
      if (!exerciseFormDraftId) return;
      
      const draft = await getWorkoutDraft(exerciseFormDraftId);
      
      if (draft && draft.draft_data) {
        console.log("Loaded draft data:", draft.draft_data);
        const data = draft.draft_data;
        
        if (data.sets !== undefined) setSets(data.sets);
        if (data.reps !== undefined) setReps(data.reps);
        if (data.restSeconds !== undefined) setRestSeconds(data.restSeconds);
        if (data.notes !== undefined) setNotes(data.notes);
        if (data.duration !== undefined) setDuration(data.duration);
        if (data.distance !== undefined) setDistance(data.distance);
      }
    };
    
    loadDraftData();
  }, [exerciseFormDraftId]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Nothing specific to clean up here, the useAutosave hook handles its cleanup internally
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // When submitting, clean up the draft
    if (exerciseFormDraftId) {
      deleteWorkoutDraft(exerciseFormDraftId);
    }
    
    onSubmit({
      sets,
      reps: isRunningExercise ? '' : reps,
      rest_seconds: restSeconds,
      notes,
      duration,
      distance
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
    <form onSubmit={handleSubmit} className="space-y-3 text-center px-2">
      {/* Display autosave status */}
      {saveStatus !== 'idle' && (
        <div className="text-xs text-right text-muted-foreground">
          {saveStatus === 'saving' && (
            <span className="flex items-center justify-end gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'success' && (
            <span className="flex items-center justify-end gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Saved
            </span>
          )}
        </div>
      )}
      
      {!isRunningExercise ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="sets" className="text-center block mb-2">Sets</Label>
            <Input
              id="sets"
              type="number"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              min={1}
              className="w-full text-center"
            />
          </div>
          
          {/* Column headers and inputs with padding adjustments */}
          <div>
            <div className="grid grid-cols-2 gap-4 mb-1">
              <div className="text-center text-sm text-muted-foreground">Reps</div>
              <div className="text-center text-sm text-muted-foreground">Weight</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  id="reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="e.g., 10 or 30s"
                  className="w-full text-center min-w-0 px-2"
                  type="text"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Input
                  disabled
                  placeholder="Client will enter"
                  className="w-full text-center bg-muted/30 min-w-0 px-2"
                />
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            For strength exercises, use just numbers (e.g., "10") to auto-populate client tracking
          </p>
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
