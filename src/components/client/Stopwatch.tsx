
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StopwatchProps {
  className?: string;
}

const Stopwatch: React.FC<StopwatchProps> = ({ className }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start or stop the stopwatch
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset the stopwatch
  const resetTimer = () => {
    setTime(0);
    if (isRunning) {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
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

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Determine text color based on time
  const getTimeColor = () => {
    if (time >= 60) return 'text-red-500'; // Red at 60 seconds
    if (time >= 45) return 'text-yellow-500'; // Yellow at 45 seconds
    return 'text-gray-800';
  };

  return (
    <div className={cn("flex items-center justify-between p-4 bg-gray-100 rounded-lg", className)}>
      <Button 
        variant="outline" 
        size="lg" 
        onClick={resetTimer} 
        className="h-12 w-12 p-0"
      >
        <RefreshCw className="h-6 w-6" />
        <span className="sr-only">Reset</span>
      </Button>
      
      <div className={cn("text-4xl font-mono font-bold flex-1 text-center", getTimeColor())}>
        {formatTime(time)}
      </div>
      
      <Button 
        variant="outline" 
        size="lg" 
        onClick={toggleTimer} 
        className={cn(
          "h-12 w-12 p-0",
          isRunning ? "bg-gray-200" : "bg-white"
        )}
      >
        {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        <span className="sr-only">{isRunning ? 'Pause' : 'Play'}</span>
      </Button>
    </div>
  );
};

export default Stopwatch;
