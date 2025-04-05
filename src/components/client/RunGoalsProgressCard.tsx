
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getWeeklyRunProgress } from '@/services/run-goals-service';
import { ArrowUp } from 'lucide-react';

export interface RunProgressData {
  miles: { completed: number; goal: number };
  exercises: { completed: number; goal: number };
  cardio: { completed: number; goal: number };
}

const RunGoalsProgressCard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<RunProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setHasError(false);
        const data = await getWeeklyRunProgress(user.id);
        setProgress(data);
      } catch (error) {
        console.error('Error loading run goals progress:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user?.id]);

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

  if (!progress || (!progress.miles.goal && !progress.exercises.goal && !progress.cardio.goal)) {
    return null; // Don't show card if no goals are set
  }

  // Calculate percentages capped at 100%
  const milesPercentage = progress.miles.goal > 0 
    ? Math.min(100, (progress.miles.completed / progress.miles.goal) * 100) 
    : 0;
  
  const exercisesPercentage = progress.exercises.goal > 0 
    ? Math.min(100, (progress.exercises.completed / progress.exercises.goal) * 100) 
    : 0;
  
  const cardioPercentage = progress.cardio.goal > 0 
    ? Math.min(100, (progress.cardio.completed / progress.cardio.goal) * 100) 
    : 0;

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-bold mb-4 text-center flex items-center justify-center gap-2">
        <ArrowUp className="w-5 h-5 text-client" />
        Weekly Goals Progress
      </h3>

      <div className="space-y-4">
        {progress.miles.goal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-lg" role="img" aria-label="Running">🏃‍♂️</span>
                <span className="font-medium">Miles</span>
              </div>
              <span>
                {progress.miles.completed.toFixed(1)} / {progress.miles.goal} miles
              </span>
            </div>
            <Progress value={milesPercentage} className="h-2" indicatorColor="bg-blue-500" />
          </div>
        )}
        
        {progress.exercises.goal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-lg" role="img" aria-label="Exercise">💪</span>
                <span className="font-medium">Exercises</span>
              </div>
              <span>
                {progress.exercises.completed} / {progress.exercises.goal}
              </span>
            </div>
            <Progress value={exercisesPercentage} className="h-2" indicatorColor="bg-amber-500" />
          </div>
        )}
        
        {progress.cardio.goal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-lg" role="img" aria-label="Cardio">❤️</span>
                <span className="font-medium">Cardio Minutes</span>
              </div>
              <span>
                {progress.cardio.completed} / {progress.cardio.goal} min
              </span>
            </div>
            <Progress value={cardioPercentage} className="h-2" indicatorColor="bg-red-500" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default RunGoalsProgressCard;
