
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchWeeklyProgress, WeeklyProgressResponse } from '@/services/weekly-progress-service';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Activity, Dumbbell, Running, Clock } from 'lucide-react';
import { ProgressMeter } from './ProgressMeter';

export const ProgramProgressSection = () => {
  const { user } = useAuth();

  const { data: weeklyProgress, isLoading, error } = useQuery({
    queryKey: ['weekly-progress', user?.id],
    queryFn: async () => {
      return await fetchWeeklyProgress(user?.id);
    },
    enabled: !!user?.id,
  });

  // Format to display as fraction (e.g., "3/5")
  const formatProgressFraction = (actual: number, target: number) => {
    return `${actual}/${target}`;
  };

  const strengthProgress = useMemo(() => {
    if (!weeklyProgress) return { percent: 0, label: "0/0" };
    
    const { actual, target } = weeklyProgress.metrics.strength_workouts;
    const percent = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
    const label = formatProgressFraction(actual, target);
    
    return { percent, label };
  }, [weeklyProgress]);

  const mobilityProgress = useMemo(() => {
    if (!weeklyProgress) return { percent: 0, label: "0/0" };
    
    const { actual, target } = weeklyProgress.metrics.strength_mobility;
    const percent = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
    const label = formatProgressFraction(actual, target);
    
    return { percent, label };
  }, [weeklyProgress]);

  const milesProgress = useMemo(() => {
    if (!weeklyProgress) return { percent: 0, label: "0/0" };
    
    const { actual, target } = weeklyProgress.metrics.miles_run;
    const percent = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
    const label = formatProgressFraction(actual, target);
    
    return { percent, label };
  }, [weeklyProgress]);

  const cardioProgress = useMemo(() => {
    if (!weeklyProgress) return { percent: 0, label: "0/0" };
    
    const { actual, target } = weeklyProgress.metrics.cardio_minutes;
    const percent = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
    const label = formatProgressFraction(actual, target);
    
    return { percent, label };
  }, [weeklyProgress]);

  if (isLoading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-client mb-2" />
          <p className="text-sm text-muted-foreground">Loading weekly progress</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !weeklyProgress) {
    return null; // Hide this section on error
  }

  // No program assigned yet
  if (!weeklyProgress.program_id) {
    return null;
  }

  const { program_title, current_week, total_weeks } = weeklyProgress;

  return (
    <Card className="border-none shadow-none bg-card/50">
      <CardContent className="p-4 pb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Week {current_week} Progress</h3>
            <span className="text-xs text-muted-foreground">Week {current_week} of {total_weeks}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <ProgressMeter 
              percent={strengthProgress.percent}
              label="Workouts"
              valueLabel={strengthProgress.label}
              icon={<Activity className="h-4 w-4" />}
            />
            
            <ProgressMeter 
              percent={mobilityProgress.percent}
              label="Mobility"
              valueLabel={mobilityProgress.label}
              icon={<Dumbbell className="h-4 w-4" />}
            />
            
            <ProgressMeter 
              percent={milesProgress.percent}
              label="Miles Run"
              valueLabel={milesProgress.label}
              icon={<Running className="h-4 w-4" />}
            />
            
            <ProgressMeter 
              percent={cardioProgress.percent}
              label="Cardio Minutes"
              valueLabel={cardioProgress.label}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
