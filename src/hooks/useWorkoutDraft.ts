
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
  updateExerciseExpansionState: (exerciseId: string, expanded: boolean) => void;
}

export function useWorkoutDraft({ 
  workoutId, 
  onDraftLoaded 
}: UseWorkoutDraftProps): UseWorkoutDraftReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [draftData, setDraftData] = useState<any | null>(null);
  const [draftLoaded, setDraftLoaded] = useState<boolean>(false);
  const [loadAttempted, setLoadAttempted] = useState<boolean>(false);
  
  const { user, authLoading } = useAuth();
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
      
      // Process the draft data even if it's empty to ensure we have a valid structure
      const processedData = draft?.draft_data || {
        exerciseStates: {},
        pendingSets: [],
        pendingCardio: [],
        pendingFlexibility: [],
        pendingRuns: []
      };
      
      if (draft && draft.draft_data) {
        console.log(`Successfully loaded draft data for ${workoutId}:`, draft.draft_data);
        setDraftData(processedData);
        
        if (onDraftLoaded) {
          onDraftLoaded(processedData);
        }
        
        toast.success('Loaded your workout progress');
      } else {
        console.log(`No draft data found for workout ${workoutId}, using empty structure`);
        setDraftData(processedData);
        
        if (onDraftLoaded) {
          onDraftLoaded(processedData);
        }
      }
    } catch (error) {
      console.error("Error loading workout draft:", error);
      
      // Set an empty but valid draft structure even on error
      const emptyDraftData = {
        exerciseStates: {},
        pendingSets: [],
        pendingCardio: [],
        pendingFlexibility: [],
        pendingRuns: []
      };
      
      setDraftData(emptyDraftData);
      
      if (onDraftLoaded) {
        onDraftLoaded(emptyDraftData);
      }
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
      
      const processedData = draft?.draft_data || {
        exerciseStates: {},
        pendingSets: [],
        pendingCardio: [],
        pendingFlexibility: [],
        pendingRuns: []
      };
      
      if (draft && draft.draft_data) {
        console.log(`Successfully refreshed draft data for ${workoutId}:`, draft.draft_data);
        setDraftData(processedData);
        
        if (onDraftLoaded) {
          onDraftLoaded(processedData);
        }
      } else {
        console.log(`No draft data found when refreshing for workout ${workoutId}`);
        setDraftData(processedData);
        
        if (onDraftLoaded) {
          onDraftLoaded(processedData);
        }
      }
    } catch (error) {
      console.error("Error refreshing workout draft:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // New function to update exercise expansion state
  const updateExerciseExpansionState = (exerciseId: string, expanded: boolean) => {
    if (!draftData || !draftData.exerciseStates) return;
    
    setDraftData(prevData => {
      const updatedExerciseStates = { ...prevData.exerciseStates };
      
      if (updatedExerciseStates[exerciseId]) {
        updatedExerciseStates[exerciseId] = {
          ...updatedExerciseStates[exerciseId],
          expanded
        };
      }
      
      return {
        ...prevData,
        exerciseStates: updatedExerciseStates
      };
    });
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
    refreshDraft,
    updateExerciseExpansionState
  };
}
