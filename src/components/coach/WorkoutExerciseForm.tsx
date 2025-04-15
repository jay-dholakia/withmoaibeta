
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
  const [location, setLocation] = useState(initialData?.location || '');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftLoadAttempted, setDraftLoadAttempted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    initialData?.completed_date ? new Date(initialData.completed_date) : new Date()
  );
  
  const { user, loading: authLoading } = useAuth();
  const lastErrorToastTimeRef = useRef<number>(0);
  
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const exerciseFormDraftId = initialData?.id ? `exercise-form-${initialData.id}` : null;

  const draftData = {
    sets,
    reps,
    restSeconds,
    notes,
    duration,
    distance,
    location,
    date: date ? date.toISOString() : undefined
  };

  const { saveStatus, errorCount } = useAutosave({
    data: draftData,
    onSave: async (data) => {
      if (!exerciseFormDraftId || !user) return false;
      
      console.log(`Saving draft data for exercise form ${exerciseFormDraftId}`);
      
      // Save to sessionStorage first for immediate access on page reload
      try {
        sessionStorage.setItem(`workout_draft_${exerciseFormDraftId}`, JSON.stringify({
          draft_data: data,
          workout_type: 'exercise_form',
          updated_at: new Date().toISOString()
        }));
      } catch (e) {
        console.warn("Failed to save draft to sessionStorage:", e);
      }
      
      return await saveWorkoutDraft(
        exerciseFormDraftId,
        'exercise_form',
        data
      );
    },
    debounce: 1000,
    disabled: !exerciseFormDraftId || !user
  });

  useEffect(() => {
    if (saveStatus === 'error' && errorCount && errorCount > 2) {
      const now = Date.now();
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

  const loadDraftData = async () => {
    if (!exerciseFormDraftId || draftLoaded || draftLoadAttempted) return;
    
    setDraftLoadAttempted(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      console.log(`Attempting to load draft data for ${exerciseFormDraftId}, user:`, user?.id);
      
      // First try to get draft from sessionStorage for faster loading
      let draft = null;
      try {
        const cachedDraft = sessionStorage.getItem(`workout_draft_${exerciseFormDraftId}`);
        if (cachedDraft) {
          draft = JSON.parse(cachedDraft);
          console.log("Retrieved draft from sessionStorage:", draft);
        }
      } catch (e) {
        console.warn("Failed to retrieve draft from sessionStorage:", e);
      }
      
      // If not in sessionStorage or user is not available yet, get from Supabase
      if (!draft || !draft.draft_data) {
        if (!user) {
          console.log("User not available yet, will retry when authenticated");
          return;
        }
        
        draft = await getWorkoutDraft(exerciseFormDraftId, 5, 500);
      }
      
      if (!isMounted.current || signal.aborted) return;
      
      if (draft && draft.draft_data) {
        const data = draft.draft_data;
        console.log(`Loaded draft data:`, data);
        
        if (data.sets !== undefined) setSets(data.sets);
        if (data.reps !== undefined) setReps(data.reps);
        if (data.restSeconds !== undefined) setRestSeconds(data.restSeconds);
        if (data.notes !== undefined) setNotes(data.notes);
        if (data.duration !== undefined) setDuration(data.duration);
        if (data.distance !== undefined) setDistance(data.distance);
        if (data.location !== undefined) setLocation(data.location);
        if (data.date !== undefined && data.date) setDate(new Date(data.date));
        
        console.log("Draft data fully loaded for exercise form", exerciseFormDraftId);
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

  useEffect(() => {
    if (!exerciseFormDraftId) {
      setDraftLoaded(true);
      return;
    }
    
    if (draftLoaded) return;
    
    if (authLoading) {
      console.log("Auth still loading, waiting before loading draft");
      return;
    }
    
    if (user) {
      console.log("User authenticated, loading draft data");
      loadDraftData();
    } else {
      console.log("User not authenticated yet, will retry when auth completes");
      
      const timer = setTimeout(() => {
        if (isMounted.current && !draftLoaded && user) {
          console.log("Retrying draft load after delay");
          loadDraftData();
        }
      }, 1500);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [exerciseFormDraftId, draftLoaded, user, authLoading, draftLoadAttempted]);

  // Ensure draft is loaded when component mounts
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (exerciseFormDraftId) {
      deleteWorkoutDraft(exerciseFormDraftId);
      // Also remove from sessionStorage
      try {
        sessionStorage.removeItem(`workout_draft_${exerciseFormDraftId}`);
      } catch (e) {
        console.warn("Failed to remove draft from sessionStorage:", e);
      }
    }
    
    onSubmit({
      sets,
      reps: isRunningExercise ? '' : reps,
      rest_seconds: restSeconds,
      notes,
      duration,
      distance,
      location,
      completed_date: date ? date.toISOString() : undefined
    });
  };

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
    <form onSubmit={handleSubmit} className="space-y-3 px-2">
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
      
      {authLoading && !draftLoaded && (
        <div className="text-xs text-center text-muted-foreground">
          <span className="flex items-center justify-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading saved data...
          </span>
        </div>
      )}
      
      {isRunningExercise ? (
        <RunningExerciseForm 
          distance={distance}
          setDistance={setDistance}
          duration={duration}
          setDuration={setDuration}
          location={location}
          setLocation={setLocation}
          notes={notes}
          setNotes={setNotes}
          date={date}
          setDate={setDate}
        />
      ) : (
        <>
          <StrengthExerciseForm
            sets={sets}
            setSets={setSets}
            reps={reps}
            setReps={setReps}
            restSeconds={restSeconds}
            setRestSeconds={setRestSeconds}
          />
          
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
        </>
      )}
      
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
