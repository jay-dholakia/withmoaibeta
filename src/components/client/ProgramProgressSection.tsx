
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchWeeklyProgress, WeeklyProgressResponse } from '@/services/weekly-progress-service';
import { useAuth } from '@/contexts/AuthContext';
import { Dumbbell, Timer, Trophy, Bike } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { WeekProgressSection } from './WeekProgressSection';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';

interface MetricCardProps {
  title: string;
  actual: number;
  target: number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard = ({ title, actual, target, icon, color }: MetricCardProps) => {
  const progress = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;

  return (
    <Card className="overflow-hidden rounded-xl border shadow">
      <CardHeader className={`bg-${color}-50 p-4 pb-2`}>
        <CardTitle className="flex justify-between items-center text-base font-semibold">
          {title}
          <span className={`bg-${color}-100 p-1.5 rounded-full text-${color}-700`}>
            {icon}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold">{actual}</span>
          <span className="text-sm text-muted-foreground">of {target}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  );
};

export function ProgramProgressSection() {
  const { user } = useAuth();
  
  const { data: weeklyProgress, isLoading, error } = useQuery({
    queryKey: ['weekly-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID available");
      return fetchWeeklyProgress(user.id);
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <Card className="overflow-hidden rounded-xl border shadow-sm">
          <CardContent className="p-8">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !weeklyProgress) {
    console.error("Error loading weekly progress:", error);
    return null;
  }
  
  const { metrics, program_title, current_week, total_weeks } = weeklyProgress;
  
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-1">
            {program_title} - Week {current_week} of {total_weeks}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Weekly progress summary
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Strength Workouts"
              actual={metrics.strength_workouts.actual}
              target={metrics.strength_workouts.target}
              icon={<Dumbbell className="h-4 w-4" />}
              color="blue"
            />
            
            <MetricCard
              title="Mobility Workouts"
              actual={metrics.strength_mobility.actual}
              target={metrics.strength_mobility.target}
              icon={<WorkoutTypeIcon type="flexibility" size="md" />}
              color="purple"
            />
            
            <MetricCard
              title="Miles Run"
              actual={metrics.miles_run.actual}
              target={metrics.miles_run.target}
              icon={<Trophy className="h-4 w-4" />}
              color="amber"
            />
            
            <MetricCard
              title="Cardio Minutes"
              actual={metrics.cardio_minutes.actual}
              target={metrics.cardio_minutes.target}
              icon={<Bike className="h-4 w-4" />}
              color="emerald"
            />
          </div>
        </CardContent>
      </Card>
      
      <WeekProgressSection />
    </div>
  );
}
