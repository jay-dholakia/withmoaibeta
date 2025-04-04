
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RunGoals, WeeklyRunProgress } from '@/types/workout';

interface GoalProgressCardProps {
  goals: RunGoals | null;
  progress: WeeklyRunProgress | null;
  isLoading?: boolean;
}

const GoalProgressCard: React.FC<GoalProgressCardProps> = ({ 
  goals, 
  progress,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goals || !progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Your goals haven't been set yet. Please contact your coach.
          </div>
        </CardContent>
      </Card>
    );
  }

  const milesPercentage = Math.min(100, Math.round((progress.miles_completed / goals.miles_goal) * 100));
  const exercisesPercentage = Math.min(100, Math.round((progress.exercises_completed / goals.exercises_goal) * 100));
  const cardioPercentage = Math.min(100, Math.round((progress.cardio_minutes_completed / goals.cardio_minutes_goal) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Miles Run</span>
              <span className="text-sm text-muted-foreground">
                {progress.miles_completed} / {goals.miles_goal} miles
              </span>
            </div>
            <Progress value={milesPercentage} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Strength Exercises</span>
              <span className="text-sm text-muted-foreground">
                {progress.exercises_completed} / {goals.exercises_goal} exercises
              </span>
            </div>
            <Progress value={exercisesPercentage} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cardio Minutes</span>
              <span className="text-sm text-muted-foreground">
                {progress.cardio_minutes_completed} / {goals.cardio_minutes_goal} minutes
              </span>
            </div>
            <Progress value={cardioPercentage} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalProgressCard;
