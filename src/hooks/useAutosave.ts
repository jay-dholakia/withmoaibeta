import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from '@/lib/utils';
import { toast } from 'sonner';

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
  const saveAttempts = useRef<number>(0);
  const maxSaveAttempts = 5;
  
  // Keep the latest data in ref for visibility change handlers
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  // Function to save data immediately (not debounced)
  const saveImmediately = useCallback(async (dataToSave: T) => {
    if (disabled) return false;
    
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      console.log('Autosaving data immediately:', dataToSave);
      
      const success = await onSave(dataToSave);
      
      if (success) {
        saveAttempts.current = 0;
        setSaveStatus('success');
        setLastSaved(new Date());
        console.log('Autosave successful at:', new Date().toISOString());
        return true;
      } else {
        saveAttempts.current += 1;
        setSaveStatus('error');
        console.error(`Autosave failed (attempt ${saveAttempts.current}/${maxSaveAttempts})`);
        
        // Retry autosave if we haven't reached max attempts
        if (saveAttempts.current < maxSaveAttempts) {
          console.log(`Retrying autosave in ${interval}ms...`);
          setTimeout(() => saveImmediately(dataToSave), interval);
        } else {
          toast.error("Failed to save your progress. Please check your connection.", {
            id: "autosave-error",
            duration: 3000
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Error during autosave:', error);
      setSaveStatus('error');
      
      // Retry on error as well
      saveAttempts.current += 1;
      if (saveAttempts.current < maxSaveAttempts) {
        console.log(`Retrying autosave after error in ${interval}ms...`);
        setTimeout(() => saveImmediately(dataToSave), interval);
      } else {
        toast.error("Failed to save your progress after multiple attempts", {
          id: "autosave-error",
          duration: 3000
        });
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [onSave, disabled, interval]);
  
  // Create a memoized, debounced save function
  const debouncedSave = useCallback(
    debounce(saveImmediately, interval),
    [saveImmediately, interval]
  );
  
  // Save data when visibility changes to hidden (user switches tabs or minimizes)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      console.log('Page visibility changed to hidden, saving data immediately');
      // Cancel debounced save and save immediately
      if (debouncedSave.cancel) debouncedSave.cancel();
      saveImmediately(dataRef.current);
    } else if (document.visibilityState === 'visible') {
      console.log('Page visibility changed to visible');
    }
  }, [debouncedSave, saveImmediately]);
  
  // Trigger the save when data changes
  useEffect(() => {
    try {
      // Deep equal comparison to determine if data has changed
      const dataAsString = JSON.stringify(data);
      const previousDataAsString = previousDataRef.current ? JSON.stringify(previousDataRef.current) : null;
      
      if (dataAsString !== previousDataAsString) {
        console.log('Data changed, scheduling save');
        previousDataRef.current = JSON.parse(dataAsString);
        debouncedSave(data);
      }
    } catch (error) {
      console.error('Error in useAutosave data comparison:', error);
    }
  }, [data, debouncedSave]);
  
  // Set up visibility change and beforeunload event listeners
  useEffect(() => {
    console.log('Setting up autosave event listeners');
    
    // Save when page is hidden (user switches tabs or minimizes)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Save when page is about to unload (user closes tab or navigates away)
    const handleBeforeUnload = () => {
      console.log('Page about to unload, saving data immediately');
      if (debouncedSave.cancel) debouncedSave.cancel();
      
      // Synchronously save - this might not complete, but worth trying
      saveImmediately(dataRef.current);
      
      // For older browsers, return a string to prompt confirmation dialog
      // Note: Modern browsers ignore custom messages
      return "You have unsaved changes. Are you sure you want to leave?";
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Make sure to save data when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      console.log('Cleaning up autosave, saving final data');
      if (debouncedSave.cancel) debouncedSave.cancel();
      saveImmediately(dataRef.current);
    };
  }, [debouncedSave, handleVisibilityChange, saveImmediately]);
  
  // Force a save every interval * 2 as a failsafe (more frequent than before)
  useEffect(() => {
    if (disabled) return;
    
    const forceSaveInterval = setInterval(() => {
      console.log('Performing scheduled autosave');
      saveImmediately(dataRef.current);
    }, interval * 2);
    
    return () => clearInterval(forceSaveInterval);
  }, [interval, disabled, saveImmediately]);
  
  return {
    isSaving,
    lastSaved,
    saveStatus,
    saveNow: () => saveImmediately(dataRef.current) // Expose direct save function
  };
}
