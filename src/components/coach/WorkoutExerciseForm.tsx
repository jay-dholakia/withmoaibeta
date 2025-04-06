
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { saveWorkoutDraft, getWorkoutDraft, deleteWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { StrengthExerciseForm } from './exercise-forms/StrengthExerciseForm';
import { RunningExerciseForm } from './exercise-forms/RunningExerciseForm';

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
  const [sets, setSets] = useState(initialData?.sets || 1);
  const [reps, setReps] = useState(initialData?.reps || '');
  const [restSeconds, setRestSeconds] = useState(initialData?.rest_seconds || 45);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [distance, setDistance] = useState(initialData?.distance || '');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const { user } = useAuth();

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
      return await saveWorkoutDraft(
        exerciseFormDraftId,
        'exercise_form',
        data
      );
    },
    disabled: !exerciseFormDraftId
  });

  // Load draft data when component mounts and user is authenticated
  useEffect(() => {
    let mounted = true;
    let loadAttemptTimeout: NodeJS.Timeout | null = null;
    
    const loadDraftData = async () => {
      if (!exerciseFormDraftId || draftLoaded || !user) return;
      
      try {
        console.log("Loading draft data for exercise form", exerciseFormDraftId);
        const draft = await getWorkoutDraft(exerciseFormDraftId, 5, 1000);
        
        if (!mounted) return;
        
        if (draft && draft.draft_data) {
          const data = draft.draft_data;
          
          if (data.sets !== undefined) setSets(data.sets);
          if (data.reps !== undefined) setReps(data.reps);
          if (data.restSeconds !== undefined) setRestSeconds(data.restSeconds);
          if (data.notes !== undefined) setNotes(data.notes);
          if (data.duration !== undefined) setDuration(data.duration);
          if (data.distance !== undefined) setDistance(data.distance);
          
          console.log("Draft data loaded for exercise form", exerciseFormDraftId);
          setDraftLoaded(true);
        } else {
          console.log("No draft data found for exercise form", exerciseFormDraftId);
          setDraftLoaded(true);
        }
      } catch (error) {
        console.error("Error loading draft data:", error);
        setDraftLoaded(true);
      }
    };
    
    // Only attempt to load draft if user is authenticated
    if (user && exerciseFormDraftId && !draftLoaded) {
      loadDraftData();
    } else if (!user && exerciseFormDraftId && !draftLoaded) {
      // If user is not authenticated yet, wait a bit and retry
      loadAttemptTimeout = setTimeout(() => {
        if (mounted && !draftLoaded) {
          console.log("Retrying draft load after timeout");
          loadDraftData();
        }
      }, 1500);
    }
    
    return () => {
      mounted = false;
      if (loadAttemptTimeout) {
        clearTimeout(loadAttemptTimeout);
      }
    };
  }, [exerciseFormDraftId, draftLoaded, user]);

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

  // Helper function to format duration input - moved to RunningExerciseForm component

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
      
      {/* Render different form based on exercise type */}
      {isRunningExercise ? (
        <RunningExerciseForm 
          distance={distance}
          setDistance={setDistance}
          duration={duration}
          setDuration={setDuration}
        />
      ) : (
        <StrengthExerciseForm
          sets={sets}
          setSets={setSets}
          reps={reps}
          setReps={setReps}
          restSeconds={restSeconds}
          setRestSeconds={setRestSeconds}
        />
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
