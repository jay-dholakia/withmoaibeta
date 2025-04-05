
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getWeeklyRunProgress, setUserRunGoals } from '@/services/run-goals-service';

export interface RunProgressData {
  miles: { completed: number; goal: number };
  exercises: { completed: number; goal: number };
  cardio: { completed: number; goal: number };
}

// Default goals to show when no goals are set
const DEFAULT_GOALS = {
  miles: 10,
  exercises: 20,
  cardio: 60
};

interface RunGoalsProgressCardProps {
  userId?: string; // Optional userId prop - if not provided, uses the current logged-in user
  showTitle?: boolean; // Whether to show the title
}

const RunGoalsProgressCard: React.FC<RunGoalsProgressCardProps> = ({ userId, showTitle = true }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<RunProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Use provided userId or fall back to the current logged-in user
  const targetUserId = userId || user?.id;

  useEffect(() => {
    const loadProgress = async () => {
      if (!targetUserId) return;
      
      try {
        console.log('Loading run goals progress for user:', targetUserId);
        setIsLoading(true);
        setHasError(false);
        const data = await getWeeklyRunProgress(targetUserId);
        console.log('Run goals progress loaded:', data);
        setProgress(data);
      } catch (error) {
        console.error('Error loading run goals progress:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [targetUserId]);

  // Log component render state
  console.log('RunGoalsProgressCard render state:', { isLoading, hasError, progress });

  // Set up goals if none exist
  useEffect(() => {
    const setupDefaultGoals = async () => {
      if (!targetUserId || isLoading || hasError || userId) return;
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
          
          // Update local state with default goals
          setProgress(prev => {
            if (!prev) return null;
            return {
              miles: { completed: prev.miles.completed, goal: DEFAULT_GOALS.miles },
              exercises: { completed: prev.exercises.completed, goal: DEFAULT_GOALS.exercises },
              cardio: { completed: prev.cardio.completed, goal: DEFAULT_GOALS.cardio }
            };
          });
        } catch (error) {
          console.error('Error setting default goals:', error);
        }
      }
    };
    
    setupDefaultGoals();
  }, [targetUserId, progress, isLoading, hasError, userId]);

  if (isLoading) {
    return (
      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Loading weekly goals...</p>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card className="p-4 text-center">
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
    <Card className="p-4">
      {showTitle && (
        <h3 className="text-lg font-bold mb-4 text-center flex items-center justify-center gap-2">
          <span className="text-xl" role="img" aria-label="Trophy">🏆</span>
          Weekly Goals Progress
        </h3>
      )}

      <div className="space-y-4">
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
              <span className="text-lg" role="img" aria-label="Exercise">💪</span>
              <span className="font-medium">Exercises</span>
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
