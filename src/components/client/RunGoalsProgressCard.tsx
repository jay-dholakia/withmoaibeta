import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getWeeklyRunProgress, setUserRunGoals } from '@/services/run-goals-service';
import { useQuery } from '@tanstack/react-query';

export interface RunProgressData {
  miles: { completed: number; goal: number };
  exercises: { completed: number; goal: number };
  cardio: { completed: number; goal: number };
}

const DEFAULT_GOALS = {
  miles: 10,
  exercises: 2,
  cardio: 60
};

interface RunGoalsProgressCardProps {
  userId?: string;
  showTitle?: boolean;
  className?: string;
  refetchKey?: any;
}

const RunGoalsProgressCard: React.FC<RunGoalsProgressCardProps> = ({ 
  userId, 
  showTitle = true, 
  className = '',
  refetchKey
}) => {
  const { user } = useAuth();
  
  const targetUserId = userId || user?.id;

  const { data: progress, isLoading, isError, refetch } = useQuery({
    queryKey: ['weekly-run-progress', targetUserId, refetchKey],
    queryFn: () => {
      if (!targetUserId) throw new Error('No user ID provided');
      console.log('Fetching weekly run progress for user:', targetUserId);
      return getWeeklyRunProgress(targetUserId);
    },
    enabled: !!targetUserId
  });

  console.log('RunGoalsProgressCard render state:', { isLoading, isError, progress });

  useEffect(() => {
    const setupDefaultGoals = async () => {
      if (!targetUserId || isLoading || isError || userId) return;
      if (progress && 
          !progress.miles.goal && 
          !progress.exercises.goal && 
          !progress.cardio.goal) {
        console.log('No goals found, setting up default goals');
        try {
          await setUserRunGoals(targetUserId, {
            miles_goal: DEFAULT_GOALS.miles,
            exercises_goal: DEFAULT_GOALS.exercises,
            cardio_minutes_goal: DEFAULT_GOALS.cardio
          });
          refetch();
        } catch (error) {
          console.error('Error setting default goals:', error);
        }
      }
    };
    
    setupDefaultGoals();
  }, [targetUserId, progress, isLoading, isError, userId, refetch]);

  if (isLoading) {
    return (
      <Card className={`p-4 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">Loading weekly goals...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={`p-4 text-center ${className}`}>
        <p className="text-sm text-red-500">Failed to load weekly goals</p>
      </Card>
    );
  }

  const displayData = progress || {
    miles: { completed: 0, goal: DEFAULT_GOALS.miles },
    exercises: { completed: 0, goal: DEFAULT_GOALS.exercises },
    cardio: { completed: 0, goal: DEFAULT_GOALS.cardio }
  };

  const milesPercentage = displayData.miles.goal > 0 
    ? Math.min(100, (displayData.miles.completed / displayData.miles.goal) * 100) 
    : 0;
  
  const exercisesPercentage = displayData.exercises.goal > 0 
    ? Math.min(100, (displayData.exercises.completed / displayData.exercises.goal) * 100) 
    : 0;
  
  const cardioPercentage = displayData.cardio.goal > 0 
    ? Math.min(100, (displayData.cardio.completed / displayData.cardio.goal) * 100) 
    : 0;

  return (
    <Card className={`p-4 mb-6 ${className}`}>
      {showTitle && (
        <h3 className="text-lg font-bold mb-4 text-center flex items-center justify-center gap-2 pb-2">
          <span className="text-xl" role="img" aria-label="Trophy">🏆</span>
          Weekly Goals Progress
        </h3>
      )}

      <div className="space-y-6 pb-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="flex items-center gap-1">
              <span className="text-lg" role="img" aria-label="Running">🏃‍♂️</span>
              <span className="font-medium">Miles</span>
            </div>
            <span className="ml-auto font-medium text-blue-600">
              {milesPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={milesPercentage} className="h-2" indicatorColor="bg-blue-500" />
          <div className="text-sm text-center text-gray-600">
            {displayData.miles.completed.toFixed(1)} / {displayData.miles.goal} miles
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="flex items-center gap-1">
              <span className="text-lg" role="img" aria-label="Exercise">🏋️</span>
              <span className="font-medium">Strength/Mobility Workouts</span>
            </div>
            <span className="ml-auto font-medium text-amber-600">
              {exercisesPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={exercisesPercentage} className="h-2" indicatorColor="bg-amber-500" />
          <div className="text-sm text-center text-gray-600">
            {displayData.exercises.completed} / {displayData.exercises.goal} workouts
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="flex items-center gap-1">
              <span className="text-lg" role="img" aria-label="Cycling">🚴</span>
              <span className="font-medium">Cross Training Cardio</span>
            </div>
            <span className="ml-auto font-medium text-red-600">
              {cardioPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={cardioPercentage} className="h-2" indicatorColor="bg-red-500" />
          <div className="text-sm text-center text-gray-600">
            {displayData.cardio.completed} / {displayData.cardio.goal} min
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RunGoalsProgressCard;
