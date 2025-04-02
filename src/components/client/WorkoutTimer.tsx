
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const WorkoutTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerColor, setTimerColor] = useState('bg-white');

  const formatTime = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    // Update color based on timer value
    if (seconds >= 60) {
      setTimerColor('bg-red-50 border-red-200');
    } else if (seconds >= 45) {
      setTimerColor('bg-yellow-50 border-yellow-200');
    } else {
      setTimerColor('bg-white border-gray-200');
    }
  }, [seconds]);

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  return (
    <Card className={cn(
      "fixed bottom-28 left-1/2 transform -translate-x-1/2 z-20 shadow-md transition-colors duration-300",
      "max-w-[200px] w-full border-2",
      timerColor
    )}>
      <CardContent className="p-3 flex flex-col items-center">
        <div className="text-2xl font-bold mb-2">{formatTime(seconds)}</div>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button 
              onClick={startTimer} 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={stopTimer} 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button 
            onClick={resetTimer} 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutTimer;
