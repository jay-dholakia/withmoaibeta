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
  const saveAttempts = useRef<number>(0);
  const maxSaveAttempts = 3;
  
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
      console.log('Autosaving data immediately:', dataToSave);
      
      const success = await onSave(dataToSave);
      
      if (success) {
        saveAttempts.current = 0;
        setSaveStatus('success');
        setLastSaved(new Date());
        console.log('Autosave successful');
      } else {
        saveAttempts.current += 1;
        setSaveStatus('error');
        console.error(`Autosave failed (attempt ${saveAttempts.current}/${maxSaveAttempts})`);
        
        // Retry autosave if we haven't reached max attempts
        if (saveAttempts.current < maxSaveAttempts) {
          console.log(`Retrying autosave in ${interval}ms...`);
          setTimeout(() => saveImmediately(dataToSave), interval);
        }
      }
    } catch (error) {
      console.error('Error during autosave:', error);
      setSaveStatus('error');
      
      // Retry on error as well
      saveAttempts.current += 1;
      if (saveAttempts.current < maxSaveAttempts) {
        console.log(`Retrying autosave after error in ${interval}ms...`);
        setTimeout(() => saveImmediately(dataToSave), interval);
      }
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
      debouncedSave.cancel();
      saveImmediately(dataRef.current);
    } else if (document.visibilityState === 'visible') {
      console.log('Page visibility changed to visible');
    }
  }, [debouncedSave, saveImmediately]);
  
  // Trigger the save when data changes
  useEffect(() => {
    try {
      // Check if the data has actually changed before saving
      const dataAsString = JSON.stringify(data);
      const previousDataAsString = previousDataRef.current ? JSON.stringify(previousDataRef.current) : null;
      
      if (dataAsString !== previousDataAsString) {
        console.log('Data changed, scheduling save');
        previousDataRef.current = JSON.parse(dataAsString);
        debouncedSave(data);
      }
    } catch (error) {
      console.error('Error in useAutosave data compare:', error);
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
      debouncedSave.cancel();
      
      // We need to use a synchronous approach here since beforeunload is immediate
      // Using the async saveImmediately directly won't complete before the page unloads
      try {
        // We still try to trigger the save, even though it might not complete
        saveImmediately(dataRef.current);
        
        // Note: Modern browsers ignore custom messages in the beforeunload event
        // So we're not setting a return value
      } catch (error) {
        console.error('Error in beforeunload handler:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Make sure to save data when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      console.log('Cleaning up autosave, saving final data');
      debouncedSave.cancel();
      saveImmediately(dataRef.current);
    };
  }, [debouncedSave, handleVisibilityChange, saveImmediately]);
  
  // Force a save every interval * 5 as a failsafe
  useEffect(() => {
    if (disabled) return;
    
    const forceSaveInterval = setInterval(() => {
      console.log('Performing scheduled autosave');
      saveImmediately(dataRef.current);
    }, interval * 5);
    
    return () => clearInterval(forceSaveInterval);
  }, [interval, disabled, saveImmediately]);
  
  return {
    isSaving,
    lastSaved,
    saveStatus,
    saveNow: () => saveImmediately(dataRef.current) // Expose direct save function
  };
}
