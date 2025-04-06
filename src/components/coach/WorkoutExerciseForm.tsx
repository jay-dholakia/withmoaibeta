
import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveWorkoutDraft, getWorkoutDraft, deleteWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const { user, loading: authLoading } = useAuth();
  const lastErrorToastTimeRef = useRef<number>(0);
  
  // Ref to track component mount state
  const isMounted = useRef(true);
  // Ref to track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

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
  const { saveStatus, errorCount } = useAutosave({
    data: draftData,
    onSave: async (data) => {
      if (!exerciseFormDraftId || !user) return false;
      return await saveWorkoutDraft(
        exerciseFormDraftId,
        'exercise_form',
        data
      );
    },
    disabled: !exerciseFormDraftId || !user
  });

  // Show error toast after multiple consecutive autosave failures
  useEffect(() => {
    if (saveStatus === 'error' && errorCount && errorCount > 2) {
      const now = Date.now();
      // Only show toast once every 10 seconds to avoid spam
      if (now - lastErrorToastTimeRef.current > 10000) {
        toast.error('Having trouble saving your progress', {
          description: 'Your changes may not be saved automatically',
          duration: 5000
        });
        lastErrorToastTimeRef.current = now;
        console.error(`Multiple autosave failures detected: ${errorCount} errors`);
      }
    }
  }, [saveStatus, errorCount]);

  // Function to load draft data
  const loadDraftData = async () => {
    if (!exerciseFormDraftId || draftLoaded || authLoading) return;
    
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      console.log(`Attempting to load draft data for ${exerciseFormDraftId}, user:`, user?.id);
      
      if (!user) {
        console.log("User not available yet, will retry when authenticated");
        return; // The useEffect hook will run again when user is available
      }
      
      const draft = await getWorkoutDraft(exerciseFormDraftId, 5, 300);
      
      // Check if component is still mounted and the request wasn't aborted
      if (!isMounted.current || signal.aborted) return;
      
      if (draft && draft.draft_data) {
        const data = draft.draft_data;
        
        // Update state with draft data
        if (data.sets !== undefined) setSets(data.sets);
        if (data.reps !== undefined) setReps(data.reps);
        if (data.restSeconds !== undefined) setRestSeconds(data.restSeconds);
        if (data.notes !== undefined) setNotes(data.notes);
        if (data.duration !== undefined) setDuration(data.duration);
        if (data.distance !== undefined) setDistance(data.distance);
        
        console.log("Draft data loaded for exercise form", exerciseFormDraftId);
        toast.success('Recovered unsaved workout progress');
      } else {
        console.log("No draft data found for exercise form", exerciseFormDraftId);
      }
      
      setDraftLoaded(true);
    } catch (error) {
      if (!isMounted.current || signal.aborted) return;
      console.error("Error loading draft data:", error);
      setDraftLoaded(true);
    }
  };
  
  // Load draft data when component mounts and user is authenticated
  useEffect(() => {
    // Don't attempt to load if there's no exerciseFormDraftId
    if (!exerciseFormDraftId) {
      setDraftLoaded(true);
      return;
    }
    
    // Don't attempt to load if already loaded
    if (draftLoaded) return;
    
    // If auth is still loading, wait
    if (authLoading) {
      console.log("Auth still loading, waiting before loading draft");
      return;
    }
    
    // If we have a user, load the draft
    if (user) {
      console.log("User authenticated, loading draft data");
      loadDraftData();
    } else {
      console.log("User not authenticated yet, will retry when auth completes");
    }
    
    return () => {
      // Cleanup function
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [exerciseFormDraftId, draftLoaded, user, authLoading]);

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
          {saveStatus === 'error' && (
            <span className="flex items-center justify-end gap-1">
              <AlertCircle className="h-3 w-3 text-destructive" />
              Save failed
            </span>
          )}
        </div>
      )}
      
      {/* Show loading indicator when auth is loading and draft hasn't been loaded */}
      {authLoading && !draftLoaded && (
        <div className="text-xs text-center text-muted-foreground">
          <span className="flex items-center justify-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading saved data...
          </span>
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
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 text-center">Notes (Optional)</label>
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
        disabled={isSubmitting || (authLoading && !draftLoaded)}
        className="w-full"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
