
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getWorkoutDraft } from '@/services/workout-draft-service';
import { useAuth } from '@/contexts/AuthContext';
import { ExerciseStates } from '@/types/active-workout';

interface UseWorkoutDraftProps {
  workoutId: string | null;
  onDraftLoaded?: (draftData: any) => void;
}

interface UseWorkoutDraftReturn {
  isLoading: boolean;
  draftData: any | null;
  draftLoaded: boolean;
  refreshDraft: () => Promise<void>;
}

export function useWorkoutDraft({ 
  workoutId, 
  onDraftLoaded 
}: UseWorkoutDraftProps): UseWorkoutDraftReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [draftData, setDraftData] = useState<any | null>(null);
  const [draftLoaded, setDraftLoaded] = useState<boolean>(false);
  const [loadAttempted, setLoadAttempted] = useState<boolean>(false);
  
  const { user, loading: authLoading } = useAuth();
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const loadDraft = async () => {
    if (!workoutId || draftLoaded || loadAttempted || !user) return;
    
    setLoadAttempted(true);
    setIsLoading(true);
    
    try {
      console.log(`Loading workout draft for ${workoutId}...`);
      
      abortControllerRef.current = new AbortController();
      
      const draft = await getWorkoutDraft(workoutId);
      
      if (!isMountedRef.current) return;
      
      if (draft && draft.draft_data) {
        console.log(`Successfully loaded draft data for ${workoutId}:`, draft.draft_data);
        setDraftData(draft.draft_data);
        
        if (onDraftLoaded) {
          onDraftLoaded(draft.draft_data);
        }
        
        toast.success('Loaded your workout progress');
      } else {
        console.log(`No draft data found for workout ${workoutId}`);
      }
    } catch (error) {
      console.error("Error loading workout draft:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setDraftLoaded(true);
      }
    }
  };
  
  const refreshDraft = async () => {
    if (!workoutId || !user) return;
    
    setIsLoading(true);
    
    try {
      console.log(`Refreshing workout draft for ${workoutId}...`);
      
      const draft = await getWorkoutDraft(workoutId);
      
      if (draft && draft.draft_data) {
        console.log(`Successfully refreshed draft data for ${workoutId}:`, draft.draft_data);
        setDraftData(draft.draft_data);
        
        if (onDraftLoaded) {
          onDraftLoaded(draft.draft_data);
        }
      } else {
        console.log(`No draft data found when refreshing for workout ${workoutId}`);
      }
    } catch (error) {
      console.error("Error refreshing workout draft:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (user && workoutId && !draftLoaded) {
      loadDraft();
    }
  }, [user, authLoading, workoutId, draftLoaded]);
  
  return {
    isLoading,
    draftData,
    draftLoaded,
    refreshDraft
  };
}
