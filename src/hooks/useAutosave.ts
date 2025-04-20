
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveProps<T> {
  data: T;
  onSave: (data: T) => Promise<boolean>;
  interval?: number;
  debounce?: number;
  disabled?: boolean;
  minChanges?: number;
}

interface AutosaveReturn {
  saveStatus: AutosaveStatus;
  lastSaved: Date | null;
  errorCount: number;
  forceSave: () => Promise<boolean>;
}

/**
 * Custom hook for autosaving data
 */
export function useAutosave<T>({
  data,
  onSave,
  interval = 10000,
  debounce = 2000,
  disabled = false,
  minChanges = 0,
}: AutosaveProps<T>): AutosaveReturn {
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);
  
  const previousDataRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const changeCountRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
  
  const serializeData = (data: T): string => {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Error serializing data for comparison:', error);
      return '';
    }
  };
  
  const hasDataChanged = (prevData: string, currentData: T): boolean => {
    const serializedCurrent = serializeData(currentData);
    return prevData !== serializedCurrent;
  };
  
  useEffect(() => {
    if (disabled) {
      setErrorCount(0);
    }
  }, [disabled]);
  
  const saveData = async (): Promise<boolean> => {
    if (isSavingRef.current || disabled || !mountedRef.current) {
      return false;
    }
    
    const currentSerializedData = serializeData(data);
    
    if (previousDataRef.current === currentSerializedData) {
      console.log('Data unchanged, skipping autosave');
      return false;
    }
    
    try {
      isSavingRef.current = true;
      if (mountedRef.current) {
        setSaveStatus('saving');
      }
      
      console.log('Autosaving data:', data);
      const success = await onSave(data);
      
      isSavingRef.current = false;
      
      if (!mountedRef.current) return false;
      
      if (success) {
        console.log('Autosave successful', {
          timestamp: new Date().toISOString(),
          lastSaved: new Date().toISOString()
        });
        setSaveStatus('saved');
        setLastSaved(new Date());
        setErrorCount(0);
        previousDataRef.current = currentSerializedData;
        changeCountRef.current = 0;
        return true;
      } else {
        console.error('Autosave returned false', {
          timestamp: new Date().toISOString()
        });
        setSaveStatus('error');
        setErrorCount(prev => prev + 1);
        return false;
      }
    } catch (error) {
      console.error('Error during autosave:', error);
      isSavingRef.current = false;
      if (mountedRef.current) {
        setSaveStatus('error');
        setErrorCount(prev => prev + 1);
      }
      return false;
    }
  };
  
  // Effect that triggers autosave when data changes
  useEffect(() => {
    if (disabled || !mountedRef.current) return;
    
    const currentSerializedData = serializeData(data);
    const hasChanged = hasDataChanged(previousDataRef.current, data);
    
    if (hasChanged) {
      console.log('Data changed, triggering autosave');
      changeCountRef.current += 1;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (changeCountRef.current >= minChanges || previousDataRef.current === '') {
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            saveData();
          }
        }, debounce);
      }
    } else {
      console.log('Data unchanged, skipping autosave');
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, disabled, debounce, minChanges]);
  
  // Effect that sets up periodic interval for autosaving
  useEffect(() => {
    if (disabled || !mountedRef.current) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Setup a new interval
    intervalRef.current = setInterval(() => {
      if (changeCountRef.current > 0 && !isSavingRef.current && mountedRef.current) {
        saveData();
      }
    }, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [disabled, interval]);
  
  const forceSave = async (): Promise<boolean> => {
    return await saveData();
  };
  
  return { saveStatus, lastSaved, errorCount, forceSave };
}
