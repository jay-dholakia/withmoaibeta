
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent 
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { updateWeeklyMetrics } from '@/services/program-metrics-service';
import { Badge } from '@/components/ui/badge';

interface WeeklyMetrics {
  targetStrengthWorkouts?: number;
  targetStrengthMobilityWorkouts?: number;
  targetMilesRun?: number;
  targetCardioMinutes?: number;
}

interface ProgramWeek {
  weekNumber: number;
  metrics: WeeklyMetrics;
  isComplete: boolean;
}

interface ProgramWeeklyMetricsFormProps {
  programId: string;
  programType: 'Moai Run' | 'Moai Strength';
  weeks: number;
  initialWeekData?: ProgramWeek[];
}

const ProgramWeeklyMetricsForm: React.FC<ProgramWeeklyMetricsFormProps> = ({
  programId,
  programType,
  weeks,
  initialWeekData = []
}) => {
  const [weeklyMetrics, setWeeklyMetrics] = useState<ProgramWeek[]>(() => {
    // Initialize with provided data or default values
    if (initialWeekData.length > 0) return initialWeekData;
    
    return Array.from({ length: weeks }, (_, i) => ({
      weekNumber: i + 1,
      metrics: {
        targetStrengthWorkouts: undefined,
        targetStrengthMobilityWorkouts: undefined,
        targetMilesRun: undefined,
        targetCardioMinutes: undefined
      },
      isComplete: false
    }));
  });

  const [savingWeek, setSavingWeek] = useState<number | null>(null);
  const [openWeeks, setOpenWeeks] = useState<number[]>([1]); // Initially open first week

  const toggleWeek = (weekNumber: number) => {
    setOpenWeeks(prev => 
      prev.includes(weekNumber) 
        ? prev.filter(w => w !== weekNumber) 
        : [...prev, weekNumber]
    );
  };

  const handleInputChange = (weekNumber: number, field: keyof WeeklyMetrics, value: string) => {
    const numericValue = value === '' ? undefined : Number(value);
    
    setWeeklyMetrics(prev => 
      prev.map(week => 
        week.weekNumber === weekNumber 
          ? {
              ...week, 
              metrics: {
                ...week.metrics,
                [field]: numericValue
              }
            }
          : week
      )
    );
  };

  const saveWeekMetrics = async (weekNumber: number) => {
    const week = weeklyMetrics.find(w => w.weekNumber === weekNumber);
    if (!week) return;

    setSavingWeek(weekNumber);
    try {
      await updateWeeklyMetrics({
        programId,
        weekNumber,
        metrics: week.metrics
      });

      toast.success(`Week ${weekNumber} metrics saved successfully`);
      
      // Mark as complete if all relevant metrics are set
      const isComplete = programType === 'Moai Run'
        ? !!(week.metrics.targetMilesRun && week.metrics.targetStrengthMobilityWorkouts && week.metrics.targetCardioMinutes)
        : !!(week.metrics.targetStrengthWorkouts && week.metrics.targetCardioMinutes);
      
      setWeeklyMetrics(prev => 
        prev.map(w => 
          w.weekNumber === weekNumber 
            ? { ...w, isComplete } 
            : w
        )
      );
    } catch (error) {
      console.error('Error saving weekly metrics:', error);
      toast.error('Failed to save metrics');
    } finally {
      setSavingWeek(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Weekly Metrics</h3>
      <p className="text-muted-foreground">
        Set target metrics for each week of the program
      </p>
      
      <div className="space-y-4">
        {weeklyMetrics.map((week) => (
          <Collapsible 
            key={week.weekNumber}
            open={openWeeks.includes(week.weekNumber)}
            onOpenChange={() => toggleWeek(week.weekNumber)}
            className="border rounded-md"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span>
                  {openWeeks.includes(week.weekNumber) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </span>
                <h4 className="font-medium">Week {week.weekNumber}</h4>
                {!week.isComplete && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
                    <AlertCircle className="h-3 w-3" />
                    Incomplete
                  </Badge>
                )}
                {week.isComplete && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                    Targets Set
                  </Badge>
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 border-t">
              <div className="space-y-4 pt-4">
                {programType === 'Moai Run' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Target Miles Run</label>
                        <Input
                          type="number"
                          value={week.metrics.targetMilesRun || ''}
                          onChange={(e) => handleInputChange(week.weekNumber, 'targetMilesRun', e.target.value)}
                          min={0}
                          placeholder="Enter target miles"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Target Strength/Mobility Workouts</label>
                        <Input
                          type="number"
                          value={week.metrics.targetStrengthMobilityWorkouts || ''}
                          onChange={(e) => handleInputChange(week.weekNumber, 'targetStrengthMobilityWorkouts', e.target.value)}
                          min={0}
                          placeholder="Enter target workouts"
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Cardio Minutes</label>
                      <Input
                        type="number"
                        value={week.metrics.targetCardioMinutes || ''}
                        onChange={(e) => handleInputChange(week.weekNumber, 'targetCardioMinutes', e.target.value)}
                        min={0}
                        placeholder="Enter target minutes"
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {programType === 'Moai Strength' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Strength Workouts</label>
                      <Input
                        type="number"
                        value={week.metrics.targetStrengthWorkouts || ''}
                        onChange={(e) => handleInputChange(week.weekNumber, 'targetStrengthWorkouts', e.target.value)}
                        min={0}
                        placeholder="Enter target workouts"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Cardio Minutes</label>
                      <Input
                        type="number"
                        value={week.metrics.targetCardioMinutes || ''}
                        onChange={(e) => handleInputChange(week.weekNumber, 'targetCardioMinutes', e.target.value)}
                        min={0}
                        placeholder="Enter target minutes"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => saveWeekMetrics(week.weekNumber)}
                  disabled={savingWeek === week.weekNumber}
                  className="w-full"
                >
                  {savingWeek === week.weekNumber ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Week {week.weekNumber} Metrics
                    </>
                  )}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default ProgramWeeklyMetricsForm;
