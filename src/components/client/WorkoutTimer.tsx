
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

// Create a global state for the timer using localStorage
let timerInterval: NodeJS.Timeout | null = null;

const WorkoutTimer = () => {
  // Use localStorage to persist timer state across page navigations
  const [seconds, setSeconds] = useState(() => {
    const savedSeconds = localStorage.getItem('workout_timer_seconds');
    return savedSeconds ? parseInt(savedSeconds, 10) : 0;
  });
  
  const [isRunning, setIsRunning] = useState(() => {
    const savedIsRunning = localStorage.getItem('workout_timer_running');
    return savedIsRunning ? savedIsRunning === 'true' : false;
  });
  
  const [timerColor, setTimerColor] = useState('bg-white');
  const [isMinimized, setIsMinimized] = useState(() => {
    const savedIsMinimized = localStorage.getItem('workout_timer_minimized');
    return savedIsMinimized ? savedIsMinimized === 'true' : false;
  });

  const formatTime = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }, []);

  useEffect(() => {
    // Clear any existing interval when component mounts to avoid duplicates
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    if (isRunning) {
      timerInterval = setInterval(() => {
        setSeconds(prevSeconds => {
          const newSeconds = prevSeconds + 1;
          localStorage.setItem('workout_timer_seconds', newSeconds.toString());
          return newSeconds;
        });
      }, 1000);
    }
    
    // Store current running state in localStorage
    localStorage.setItem('workout_timer_running', isRunning.toString());
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
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

  // Save minimized state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('workout_timer_minimized', isMinimized.toString());
  }, [isMinimized]);

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
    localStorage.setItem('workout_timer_seconds', '0');
  };
  
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  // Position differently based on whether it's minimized
  const positionClasses = isMinimized
    ? "fixed top-20 right-4 z-50 max-w-[120px]" 
    : "fixed bottom-36 left-0 right-0 z-10 mx-auto max-w-md";

  if (isMinimized) {
    return (
      <Card 
        className={cn(
          positionClasses,
          "shadow-md border-2 bg-opacity-95 cursor-pointer",
          timerColor
        )}
        onClick={toggleMinimized}
      >
        <CardContent className="p-2 flex items-center justify-between">
          <Timer className="h-4 w-4 mr-1" />
          <div className="text-sm font-bold">{formatTime(seconds)}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      positionClasses,
      "shadow-md border-2 bg-opacity-95",
      timerColor
    )}>
      <CardContent className="p-3 flex justify-between items-center">
        <div className="text-2xl font-bold">{formatTime(seconds)}</div>
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
          <Button
            onClick={toggleMinimized}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <Timer className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutTimer;
