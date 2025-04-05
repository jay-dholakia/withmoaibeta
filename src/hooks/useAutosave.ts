import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from '@/lib/utils';

interface UseAutosaveProps<T> {
  data: T;
  onSave: (data: T) => Promise<boolean>;
  interval?: number;
  disabled?: boolean;
}

export function useAutosave<T>({ 
  data, 
  onSave, 
  interval = 2000, 
  disabled = false 
}: UseAutosaveProps<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const previousDataRef = useRef<T | null>(null);
  const dataRef = useRef<T>(data);
  
  // Keep the latest data in ref for visibility change handlers
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  // Function to save data immediately (not debounced)
  const saveImmediately = useCallback(async (dataToSave: T) => {
    if (disabled) return;
    
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      
      const success = await onSave(dataToSave);
      
      if (success) {
        setSaveStatus('success');
        setLastSaved(new Date());
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error during autosave:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, disabled]);
  
  // Create a memoized, debounced save function
  const debouncedSave = useCallback(
    debounce(saveImmediately, interval),
    [saveImmediately, interval]
  );
  
  // Save data when visibility changes to hidden (user switches tabs or minimizes)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      // Cancel debounced save and save immediately
      debouncedSave.cancel();
      saveImmediately(dataRef.current);
    }
  }, [debouncedSave, saveImmediately]);
  
  // Trigger the save when data changes
  useEffect(() => {
    // Check if the data has actually changed before saving
    const dataAsString = JSON.stringify(data);
    const previousDataAsString = previousDataRef.current ? JSON.stringify(previousDataRef.current) : null;
    
    if (dataAsString !== previousDataAsString) {
      previousDataRef.current = JSON.parse(dataAsString);
      debouncedSave(data);
    }
  }, [data, debouncedSave]);
  
  // Set up visibility change and beforeunload event listeners
  useEffect(() => {
    // Save when page is hidden (user switches tabs or minimizes)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Save when page is about to unload (user closes tab or navigates away)
    const handleBeforeUnload = () => {
      debouncedSave.cancel();
      saveImmediately(dataRef.current);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      debouncedSave.cancel();
    };
  }, [debouncedSave, handleVisibilityChange, saveImmediately]);
  
  return {
    isSaving,
    lastSaved,
    saveStatus
  };
}
