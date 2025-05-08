import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, RefreshCw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutosaveStatus } from "@/hooks/useAutosave";

interface StopwatchProps {
  className?: string;
  saveStatus?: AutosaveStatus;
  workoutCompletionId?: string;
}

interface TimerState {
  isRunning: boolean;
  startTimestamp: number | null;
  accumulatedTime: number;
}

const Stopwatch: React.FC<StopwatchProps> = ({ className, saveStatus, workoutCompletionId }) => {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  
  const timerKey = `workout_timer_${workoutCompletionId || 'default'}`;
  
  // Load persisted timer state when component mounts
  useEffect(() => {
    const loadTimerState = () => {
      try {
        const persistedState = localStorage.getItem(timerKey);
        
        if (persistedState) {
          const { isRunning, startTimestamp, accumulatedTime } = JSON.parse(persistedState) as TimerState;
          
          if (isRunning && startTimestamp) {
            // Timer was running, calculate elapsed time since it was started plus previously accumulated time
            const elapsedSinceStart = Math.floor((Date.now() - startTimestamp) / 1000);
            setTime(accumulatedTime + elapsedSinceStart);
            setIsRunning(true);
          } else {
            // Timer was paused
            setTime(accumulatedTime);
            setIsRunning(false);
          }
        } else {
          // No persisted state, reset timer
          setTime(0);
          setIsRunning(false);
        }
        setInitialized(true);
      } catch (error) {
        console.error("Error loading timer state:", error);
        setTime(0);
        setIsRunning(false);
        setInitialized(true);
      }
    };
    
    // Load timer state when workoutCompletionId changes
    if (workoutCompletionId) {
      loadTimerState();
    } else {
      setTime(0);
      setIsRunning(false);
      setInitialized(true);
    }
    
    return () => {
      // Persist current state on component unmount
      if (initialized) {
        persistTimerState();
      }
    };
  }, [workoutCompletionId, timerKey]);

  // Persist timer state whenever it changes
  const persistTimerState = () => {
    if (!initialized) return; // Don't persist until fully initialized
    
    try {
      const state: TimerState = {
        isRunning,
        startTimestamp: isRunning ? Date.now() - (time * 1000) : null,
        accumulatedTime: time
      };
      
      localStorage.setItem(timerKey, JSON.stringify(state));
    } catch (error) {
      console.error("Error persisting timer state:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && initialized) {
      // Store current timestamp and accumulated time for precise timing
      const startTimestamp = Date.now() - (time * 1000);
      
      interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000);
        setTime(elapsedSeconds);
      }, 100); // Update more frequently for smoother display
      
      // Update persisted state when timer starts
      const state: TimerState = {
        isRunning: true,
        startTimestamp,
        accumulatedTime: time
      };
      localStorage.setItem(timerKey, JSON.stringify(state));
    } else if (initialized) {
      // Update persisted state when timer stops
      persistTimerState();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, initialized, timerKey]);

  // Update persisted state when time changes significantly
  useEffect(() => {
    if (!isRunning && initialized) {
      persistTimerState();
    }
  }, [time, isRunning, initialized]);

  // Ensure timer state is persisted when window is about to unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistTimerState();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning, time]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const formattedHours = hrs > 0 ? `${hrs}:` : '';
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    
    return `${formattedHours}${formattedMins}:${formattedSecs}`;
  };

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
    
    // Clear persisted state on reset
    localStorage.removeItem(timerKey);
  };

  const toggleRunning = () => {
    if (!isRunning) {
      // When starting, persist the current state with updated startTimestamp
      const state: TimerState = {
        isRunning: true,
        startTimestamp: Date.now() - (time * 1000),
        accumulatedTime: time
      };
      localStorage.setItem(timerKey, JSON.stringify(state));
    } else {
      // When pausing, update the accumulated time
      const state: TimerState = {
        isRunning: false,
        startTimestamp: null,
        accumulatedTime: time
      };
      localStorage.setItem(timerKey, JSON.stringify(state));
    }
    
    setIsRunning(!isRunning);
  };
  
  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Save className="h-4 w-4 animate-pulse text-amber-500" />;
      case 'saved':
        return <Save className="h-4 w-4 text-green-500" />;
      case 'error':
        return <Save className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex justify-between items-center py-2 px-4 bg-background border rounded-md shadow-sm", className)}>
      <div className="text-xl font-semibold">{formatTime(time)}</div>
      
      <div className="flex items-center gap-2">
        {getSaveStatusIcon()}
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={toggleRunning}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
          className="h-8 w-8 p-0"
        >
          {isRunning ? (
            <PauseCircle className="h-5 w-5" />
          ) : (
            <PlayCircle className="h-5 w-5" />
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleReset}
          aria-label="Reset timer"
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Stopwatch;
