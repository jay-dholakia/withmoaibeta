
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
  const errorCountRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a memoized, debounced save function
  const debouncedSave = useCallback(
    debounce(async (dataToSave: T) => {
      if (disabled) return;
      
      try {
        setIsSaving(true);
        setSaveStatus('saving');
        
        // Get user's timezone for error reporting
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log("Autosaving data:", dataToSave);
        const success = await onSave(dataToSave);
        
        if (success) {
          setSaveStatus('success');
          setLastSaved(new Date());
          errorCountRef.current = 0; // Reset error count on success
          console.log("Autosave successful", {
            timestamp: new Date().toISOString(),
            lastSaved: new Date().toISOString()
          });
        } else {
          console.warn('Autosave failed: onSave returned false', {
            timestamp: new Date().toISOString(),
            localTime: new Date().toString(),
            timezone: userTimeZone,
            data: typeof dataToSave === 'object' ? 
              { ...dataToSave, size: JSON.stringify(dataToSave).length } : 
              dataToSave
          });
          setSaveStatus('error');
          errorCountRef.current += 1;
        }
      } catch (error) {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.error('Error during autosave:', {
          error,
          timestamp: new Date().toISOString(),
          localTime: new Date().toString(),
          timezone: userTimeZone,
          data: typeof dataToSave === 'object' ? 
            { dataSize: JSON.stringify(dataToSave).length } : 
            'non-object data'
        });
        setSaveStatus('error');
        errorCountRef.current += 1;
      } finally {
        setIsSaving(false);
      }
    }, interval),
    [onSave, interval, disabled]
  );
  
  // Trigger the save when data changes
  useEffect(() => {
    // Check if the data has actually changed before saving
    const dataAsString = JSON.stringify(data);
    const previousDataAsString = previousDataRef.current ? JSON.stringify(previousDataRef.current) : null;
    
    // Clean up any existing timeout to prevent race conditions
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    if (dataAsString !== previousDataAsString) {
      console.log("Data changed, triggering autosave");
      previousDataRef.current = JSON.parse(dataAsString);
      debouncedSave(data);
    } else {
      console.log("Data unchanged, skipping autosave");
    }
  }, [data, debouncedSave]);
  
  // Also trigger a save on component unmount if there are pending changes
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      
      // If there's unsaved data and we're not currently saving, do a final save
      if (previousDataRef.current && !isSaving) {
        onSave(previousDataRef.current).catch(error => {
          console.error("Error during final autosave on unmount:", error);
        });
      }
    };
  }, [debouncedSave, onSave, isSaving]);
  
  return {
    isSaving,
    lastSaved,
    saveStatus,
    errorCount: errorCountRef.current
  };
}
