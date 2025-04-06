
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
  
  // Create a memoized, debounced save function
  const debouncedSave = useCallback(
    debounce(async (dataToSave: T) => {
      if (disabled) return;
      
      try {
        setIsSaving(true);
        setSaveStatus('saving');
        
        // Get user's timezone for error reporting
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const success = await onSave(dataToSave);
        
        if (success) {
          setSaveStatus('success');
          setLastSaved(new Date());
          errorCountRef.current = 0; // Reset error count on success
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
    
    if (dataAsString !== previousDataAsString) {
      previousDataRef.current = JSON.parse(dataAsString);
      debouncedSave(data);
    }
  }, [data, debouncedSave]);
  
  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);
  
  return {
    isSaving,
    lastSaved,
    saveStatus,
    errorCount: errorCountRef.current
  };
}
