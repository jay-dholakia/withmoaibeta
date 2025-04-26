
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, RefreshCw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutosaveStatus } from "@/hooks/useAutosave";

interface StopwatchProps {
  className?: string;
  saveStatus?: AutosaveStatus;
  workoutCompletionId?: string;  // Add this to track current workout
}

const Stopwatch: React.FC<StopwatchProps> = ({ className, saveStatus, workoutCompletionId }) => {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Reset timer when workoutCompletionId changes
  useEffect(() => {
    // Always start at 0 when a new workout is loaded
    setTime(0);
    localStorage.setItem("workout_start_time", Date.now().toString());
    setIsRunning(true);  // Automatically start the timer when workout loads
  }, [workoutCompletionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

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
    localStorage.setItem("workout_start_time", Date.now().toString());
  };

  const toggleRunning = () => {
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
    <div className={cn("flex justify-between items-center py-3 px-4 bg-background border rounded-md shadow-sm", className)}>
      <div className="text-xl font-semibold">{formatTime(time)}</div>
      
      <div className="flex items-center gap-2">
        {getSaveStatusIcon()}
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleRunning}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? (
            <PauseCircle className="h-5 w-5" />
          ) : (
            <PlayCircle className="h-5 w-5" />
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleReset}
          aria-label="Reset timer"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Stopwatch;
