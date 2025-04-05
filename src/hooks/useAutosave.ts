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
  
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  const save = useCallback(async (dataToSave: T) => {
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
  
  const debouncedSave = useCallback(
    debounce(save, interval),
    [save, interval]
  );
  
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      debouncedSave.cancel();
      
      if (!disabled && dataRef.current) {
        console.log("Page hidden, forcing immediate save");
        save(dataRef.current);
      }
    }
  }, [debouncedSave, save, disabled]);
  
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);
  
  useEffect(() => {
    const dataAsString = JSON.stringify(data);
    const previousDataAsString = previousDataRef.current ? JSON.stringify(previousDataRef.current) : null;
    
    if (dataAsString !== previousDataAsString) {
      previousDataRef.current = JSON.parse(dataAsString);
      debouncedSave(data);
    }
  }, [data, debouncedSave]);
  
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      
      if (!disabled && dataRef.current) {
        console.log("Component unmounting, triggering final save");
        save(dataRef.current);
      }
    };
  }, [disabled, save, debouncedSave]);
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!disabled && dataRef.current) {
        debouncedSave.cancel();
        
        console.log("Page unloading, triggering final save");
        save(dataRef.current);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [disabled, save, debouncedSave]);
  
  return {
    isSaving,
    lastSaved,
    saveStatus
  };
}
