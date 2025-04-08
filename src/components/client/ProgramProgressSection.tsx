
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { fetchWeeklyProgress, WeeklyProgressResponse } from '@/services/weekly-progress-service';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  label, 
  value, 
  max, 
  color = 'bg-client' 
}) => {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{value}/{max}</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
        style={{ 
          '--progress-background': color === 'bg-client' ? 'var(--client)' : color
        } as React.CSSProperties}
      />
    </div>
  );
};

export const ProgramProgressSection: React.FC = () => {
  const { user } = useAuth();

  const { 
    data: weeklyProgress, 
    isLoading,
    error,
  } = useQuery<WeeklyProgressResponse>({
    queryKey: ['weekly-progress', user?.id],
    queryFn: () => fetchWeeklyProgress(user?.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse mt-4"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-center text-red-500">
            Error loading program progress. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isRunProgram = weeklyProgress?.program_type === 'moai_run';
  
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">
            {weeklyProgress?.program_title || 'Weekly Progress'} 
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (Week {weeklyProgress?.current_week}/{weeklyProgress?.total_weeks})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* For Run programs, miles_run is always shown */}
          {(isRunProgram || (weeklyProgress?.metrics.miles_run.target || 0) > 0) && (
            <ProgressBar 
              label="Miles Run" 
              value={weeklyProgress?.metrics.miles_run.actual || 0} 
              max={weeklyProgress?.metrics.miles_run.target || 0}
              color="bg-blue-500"
            />
          )}
          
          {/* For Strength programs, show Strength Workouts */}
          <ProgressBar 
            label={isRunProgram ? "Strength & Mobility Workouts" : "Strength Workouts"} 
            value={isRunProgram
              ? (weeklyProgress?.metrics.strength_mobility.actual || 0)
              : (weeklyProgress?.metrics.strength_workouts.actual || 0)} 
            max={isRunProgram
              ? (weeklyProgress?.metrics.strength_mobility.target || 0)
              : (weeklyProgress?.metrics.strength_workouts.target || 0)}
            color="bg-purple-500"
          />
          
          {/* Cardio Minutes for all program types */}
          <ProgressBar 
            label="Cardio Minutes" 
            value={weeklyProgress?.metrics.cardio_minutes.actual || 0} 
            max={weeklyProgress?.metrics.cardio_minutes.target || 0}
            color="bg-green-500"
          />
        </CardContent>
      </Card>
    </div>
  );
};
