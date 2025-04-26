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
  const saveAttemptsRef = useRef<number>(0);
  
  useEffect(() => {
    mountedRef.current = true;
    
    // Initialize with current data
    previousDataRef.current = serializeData(data);
    console.log('[Autosave] Initialized with data', {
      dataSize: previousDataRef.current.length,
      disabled,
      interval,
      debounce
    });
    
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
      console.error('[Autosave] Error serializing data for comparison:', error);
      return '';
    }
  };
  
  const hasDataChanged = (prevData: string, currentData: T): boolean => {
    const serializedCurrent = serializeData(currentData);
    const hasChanged = prevData !== serializedCurrent;
    if (hasChanged) {
      console.log('[Autosave] Data changed', {
        prevSize: prevData.length,
        currentSize: serializedCurrent.length,
      });
    }
    return hasChanged;
  };
  
  useEffect(() => {
    if (disabled) {
      setErrorCount(0);
    }
  }, [disabled]);
  
  const saveData = async (retryCount = 0): Promise<boolean> => {
    if (isSavingRef.current || disabled || !mountedRef.current) {
      return false;
    }
    
    const currentSerializedData = serializeData(data);
    
    if (previousDataRef.current === currentSerializedData) {
      console.log('[Autosave] Data unchanged, skipping autosave');
      return false;
    }
    
    try {
      isSavingRef.current = true;
      saveAttemptsRef.current++;
      
      if (mountedRef.current) {
        setSaveStatus('saving');
      }
      
      console.log('[Autosave] Saving data...', {
        attemptNumber: saveAttemptsRef.current,
        dataSize: currentSerializedData.length,
        changesCount: changeCountRef.current,
        timestamp: new Date().toISOString()
      });
      
      const success = await onSave(data);
      
      isSavingRef.current = false;
      
      if (!mountedRef.current) return false;
      
      if (success) {
        console.log('[Autosave] Save successful', {
          timestamp: new Date().toISOString()
        });
        setSaveStatus('saved');
        setLastSaved(new Date());
        setErrorCount(0);
        previousDataRef.current = currentSerializedData;
        changeCountRef.current = 0;
        
        // Dispatch autosave event
        window.dispatchEvent(new Event('workout:autosave'));
        
        return true;
      } else {
        console.error('[Autosave] Save returned false', {
          timestamp: new Date().toISOString(),
          retryCount
        });
        setSaveStatus('error');
        setErrorCount(prev => prev + 1);
        
        // Auto-retry on failure (max 3 retries)
        if (retryCount < 3 && mountedRef.current) {
          console.log(`[Autosave] Retrying save (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => {
            saveData(retryCount + 1);
          }, 2000);
        }
        
        return false;
      }
    } catch (error) {
      console.error('[Autosave] Error during save:', error);
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
      console.log('[Autosave] Data change detected, triggering autosave');
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
