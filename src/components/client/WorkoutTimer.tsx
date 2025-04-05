
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WorkoutTimer: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start or pause timer
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  // Format seconds as MM:SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Get color based on time elapsed
  const getTimerColor = () => {
    if (seconds >= 60) return 'text-red-500'; // Red after 1 minute
    if (seconds >= 45) return 'text-amber-500'; // Yellow after 45 seconds
    return 'text-gray-700'; // Default color
  };

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return (
    <div className="flex items-center justify-between w-full mb-3 px-1">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={toggleTimer}
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0 ml-2" 
          onClick={resetTimer}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className={`font-mono text-lg font-semibold ${getTimerColor()}`}>
        {formatTime(seconds)}
      </div>
    </div>
  );
};

export default WorkoutTimer;
