
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { saveWorkoutDraft, getWorkoutDraft, deleteWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [draftLoaded, setDraftLoaded] = useState(false);

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

  // Enhanced draft loading logic
  useEffect(() => {
    const loadDraftData = async () => {
      if (!exerciseFormDraftId || draftLoaded) return;
      
      try {
        // Check for user session
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No authenticated user found for exercise form draft");
          return;
        }
        
        const draft = await getWorkoutDraft(exerciseFormDraftId);
        
        if (draft && draft.draft_data) {
          const data = draft.draft_data;
          
          if (data.sets !== undefined) setSets(data.sets);
          if (data.reps !== undefined) setReps(data.reps);
          if (data.restSeconds !== undefined) setRestSeconds(data.restSeconds);
          if (data.notes !== undefined) setNotes(data.notes);
          if (data.duration !== undefined) setDuration(data.duration);
          if (data.distance !== undefined) setDistance(data.distance);
          
          console.log("Successfully loaded exercise form draft data");
        }
        
        // Mark draft as loaded
        setDraftLoaded(true);
      } catch (error) {
        console.error("Error loading exercise form draft:", error);
      }
    };
    
    loadDraftData();
  }, [exerciseFormDraftId, draftLoaded]);

  // Fix the getWorkoutDraft service to handle auth issues better
  <lov-write file_path="src/services/workout-draft-service.ts">
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves a workout draft to the server
 */
export const saveWorkoutDraft = async (
  workoutId: string | null,
  workoutType: string | null,
  draftData: any
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }
    
    // Check if a draft already exists for this workout
    const { data: existingDraft } = await supabase
      .from('workout_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId || '')
      .maybeSingle();
      
    if (existingDraft) {
      // Update existing draft
      const { error } = await supabase
        .from('workout_drafts')
        .update({ 
          draft_data: draftData,
          workout_type: workoutType
        })
        .eq('id', existingDraft.id);
        
      if (error) {
        console.error("Error updating workout draft:", error);
        return false;
      }
    } else {
      // Create new draft
      const { error } = await supabase
        .from('workout_drafts')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          workout_type: workoutType,
          draft_data: draftData
        });
        
      if (error) {
        console.error("Error creating workout draft:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveWorkoutDraft:", error);
    return false;
  }
};

/**
 * Retrieves a workout draft from the server
 * This version includes better handling for auth state
 */
export const getWorkoutDraft = async (
  workoutId: string | null
): Promise<any | null> => {
  if (!workoutId) {
    console.log("No workoutId provided to getWorkoutDraft");
    return null;
  }
  
  try {
    // Check if we have a session
    const { data, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !data.session) {
      console.log("No active session found:", sessionError);
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found");
      return null;
    }
    
    const { data: draftData, error } = await supabase
      .from('workout_drafts')
      .select('draft_data, workout_type')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId)
      .maybeSingle();
      
    if (error) {
      console.error("Error retrieving workout draft:", error);
      return null;
    }
    
    return draftData;
  } catch (error) {
    console.error("Error in getWorkoutDraft:", error);
    return null;
  }
};

/**
 * Deletes a workout draft from the server
 */
export const deleteWorkoutDraft = async (
  workoutId: string | null
): Promise<boolean> => {
  if (!workoutId) {
    return false;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }
    
    const { error } = await supabase
      .from('workout_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('workout_id', workoutId);
      
    if (error) {
      console.error("Error deleting workout draft:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteWorkoutDraft:", error);
    return false;
  }
};
