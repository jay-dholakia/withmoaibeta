
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

// Default goals to show when no goals are set
const DEFAULT_GOALS = {
  miles: 10,
  exercises: 2, // This is 2 workouts per week
  cardio: 60
};

interface RunGoalsProgressCardProps {
  userId?: string; // Optional userId prop - if not provided, uses the current logged-in user
  showTitle?: boolean; // Whether to show the title
  className?: string; // Additional CSS classes to apply
  refetchKey?: any; // Additional dependency to trigger refetches
}

const RunGoalsProgressCard: React.FC<RunGoalsProgressCardProps> = ({ 
  userId, 
  showTitle = true, 
  className = '',
  refetchKey
}) => {
  const { user } = useAuth();
  
  // Use provided userId or fall back to the current logged-in user
  const targetUserId = userId || user?.id;

  // Use react-query for better cache management and auto refetching
  const { data: progress, isLoading, isError, refetch } = useQuery({
    queryKey: ['weekly-run-progress', targetUserId, refetchKey],
    queryFn: () => {
      if (!targetUserId) throw new Error('No user ID provided');
      console.log('Fetching weekly run progress for user:', targetUserId);
      return getWeeklyRunProgress(targetUserId);
    },
    enabled: !!targetUserId
  });

  // Log component render state
  console.log('RunGoalsProgressCard render state:', { isLoading, isError, progress });

  // Set up goals if none exist
  useEffect(() => {
    const setupDefaultGoals = async () => {
      if (!targetUserId || isLoading || isError || userId) return;
      // Skip setting up default goals if this is not the current user's card
      
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
          
          // Trigger refetch to get updated goals
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

  // Always show the component, using either actual goals or default values
  const displayData = progress || {
    miles: { completed: 0, goal: DEFAULT_GOALS.miles },
    exercises: { completed: 0, goal: DEFAULT_GOALS.exercises },
    cardio: { completed: 0, goal: DEFAULT_GOALS.cardio }
  };

  // Calculate percentages capped at 100%
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

      <div className="space-y-4 pb-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-lg" role="img" aria-label="Running">🏃‍♂️</span>
              <span className="font-medium">Miles</span>
            </div>
            <div className="flex items-center">
              <span>
                {displayData.miles.completed.toFixed(1)} / {displayData.miles.goal} miles
              </span>
              <span className="ml-2 font-medium text-blue-600">
                {milesPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={milesPercentage} className="h-2" indicatorColor="bg-blue-500" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-lg" role="img" aria-label="Exercise">🏋️</span>
              <span className="font-medium">Strength/Mobility Workouts</span>
            </div>
            <div className="flex items-center">
              <span>
                {displayData.exercises.completed} / {displayData.exercises.goal}
              </span>
              <span className="ml-2 font-medium text-amber-600">
                {exercisesPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={exercisesPercentage} className="h-2" indicatorColor="bg-amber-500" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-lg" role="img" aria-label="Cardio">❤️</span>
              <span className="font-medium">Cardio Minutes</span>
            </div>
            <div className="flex items-center">
              <span>
                {displayData.cardio.completed} / {displayData.cardio.goal} min
              </span>
              <span className="ml-2 font-medium text-red-600">
                {cardioPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={cardioPercentage} className="h-2" indicatorColor="bg-red-500" />
        </div>
      </div>
    </Card>
  );
};

export default RunGoalsProgressCard;
