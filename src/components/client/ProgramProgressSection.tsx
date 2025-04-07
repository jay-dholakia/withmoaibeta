
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { LogRunActivityDialog } from './LogRunActivityDialog';
import { LogCardioActivityDialog } from './LogCardioActivityDialog';
import { LogRestDayDialog } from './LogRestDayDialog';
import { fetchWeeklyProgress, WeeklyProgressResponse } from '@/services/weekly-progress-service';
import { toast } from 'sonner';

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
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showCardioDialog, setShowCardioDialog] = useState(false);
  const [showRestDialog, setShowRestDialog] = useState(false);
  
  const { 
    data: weeklyProgress, 
    isLoading,
    error,
    refetch 
  } = useQuery<WeeklyProgressResponse>({
    queryKey: ['weekly-progress', user?.id],
    queryFn: () => fetchWeeklyProgress(user?.id),
    enabled: !!user?.id,
  });

  const handleActivitySuccess = () => {
    toast.success("Activity logged successfully!");
    refetch();
  };

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
          {/* Only display Miles Run for Moai Run program or if there's a non-zero target */}
          {(isRunProgram || (weeklyProgress?.metrics.miles_run.target || 0) > 0) && (
            <ProgressBar 
              label="Miles Run" 
              value={weeklyProgress?.metrics.miles_run.actual || 0} 
              max={weeklyProgress?.metrics.miles_run.target || 0}
              color="bg-blue-500"
            />
          )}
          
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
          
          <ProgressBar 
            label="Cardio Minutes" 
            value={weeklyProgress?.metrics.cardio_minutes.actual || 0} 
            max={weeklyProgress?.metrics.cardio_minutes.target || 0}
            color="bg-green-500"
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Log Activity</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => setShowRunDialog(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="flex items-center">
              Log a Run <span role="img" aria-label="running" className="text-lg ml-1">🏃</span>
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            onClick={() => setShowCardioDialog(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="flex items-center">
              Log Cardio <span role="img" aria-label="cycling" className="text-lg ml-1">🚴</span>
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => setShowRestDialog(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="flex items-center">
              Log Rest <span role="img" aria-label="sleep" className="text-lg ml-1">😴</span>
            </span>
          </Button>
        </div>
      </div>
      
      <LogRunActivityDialog 
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        onSuccess={handleActivitySuccess}
      />
      
      <LogCardioActivityDialog 
        open={showCardioDialog}
        onOpenChange={setShowCardioDialog}
        onSuccess={handleActivitySuccess}
      />
      
      <LogRestDayDialog 
        open={showRestDialog}
        onOpenChange={setShowRestDialog}
        onSuccess={handleActivitySuccess}
      />
    </div>
  );
};
