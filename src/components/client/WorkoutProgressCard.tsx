
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutType, WorkoutTypeIcon } from './WorkoutTypeIcon';
import { format } from 'date-fns';
import { detectWorkoutTypeFromText } from '@/services/workout-edit-service';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface WorkoutProgressCardProps {
  label: string;
  completedDates: Date[];
  lifeHappensDates: Date[];
  count: number;
  total: number;
  workoutTypesMap?: Record<string, WorkoutType>;
  workoutTitlesMap?: Record<string, string>; // Separate map for titles
  userName?: string;
  isCurrentUser?: boolean;
  workoutDetailsMap?: Record<string, { title: string; type: WorkoutType }>;
}

export const WorkoutProgressCard = ({
  label,
  completedDates,
  lifeHappensDates,
  count,
  total,
  workoutTypesMap = {},
  workoutTitlesMap = {}, // Initialize the titles map
  userName,
  isCurrentUser,
  workoutDetailsMap = {}
}: WorkoutProgressCardProps) => {
  // Default to 6 if total is 0 or undefined
  const displayTotal = total <= 0 ? 6 : total;
  const [isOpen, setIsOpen] = useState(false);
  
  const weekDays = [
    { shortName: 'M', fullName: 'Monday' },
    { shortName: 'T', fullName: 'Tuesday' },
    { shortName: 'W', fullName: 'Wednesday' },
    { shortName: 'T', fullName: 'Thursday' },
    { shortName: 'F', fullName: 'Friday' },
    { shortName: 'S', fullName: 'Saturday' },
    { shortName: 'S', fullName: 'Sunday' }
  ];
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="shadow-sm border-slate-200 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">
              {userName ? (
                <span>
                  {userName}
                  {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                </span>
              ) : (
                label
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-client">{count}/{displayTotal}</span>
              {isCurrentUser && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 border-client text-client hover:bg-client/10"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to="/client-dashboard/workouts">
                    <Plus className="h-4 w-4 mr-1" />
                    Log Workout
                  </Link>
                </Button>
              )}
              <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-4">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-client h-full rounded-full"
              style={{ width: `${Math.min(100, (count / displayTotal) * 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-4 px-1">
            {weekDays.map((day, index) => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
              
              const currentDay = new Date(weekStart);
              currentDay.setDate(weekStart.getDate() + index);
              
              const isDayCompleted = completedDates.some(date => 
                new Date(date).toDateString() === currentDay.toDateString()
              );
              
              const isLifeHappens = lifeHappensDates.some(date => 
                new Date(date).toDateString() === currentDay.toDateString()
              );
              
              const isToday = today.toDateString() === currentDay.toDateString();
              
              // Format date to get the correct workout type from map
              const dateStr = format(currentDay, 'yyyy-MM-dd');
              let workoutType = workoutTypesMap[dateStr];
              
              // If we don't have a defined workout type but the day is completed,
              // detect it from any workout title we might have
              if (!workoutType && isDayCompleted && workoutTitlesMap[dateStr]) {
                const title = workoutTitlesMap[dateStr];
                workoutType = detectWorkoutTypeFromText(title);
              }
              
              // Fallback to defaults if still no workout type
              if (!workoutType) {
                workoutType = isLifeHappens ? 'rest_day' : 'strength';
              }
              
              // Use lighter background colors for better emoji visibility
              let bgColor = 'bg-slate-50';
              
              if (isLifeHappens) {
                bgColor = 'bg-yellow-50';
              }
              
              if (isDayCompleted) {
                bgColor = 'bg-client/10';
              }
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${bgColor} border border-slate-200`}>
                    {(isDayCompleted || isLifeHappens) ? (
                      <WorkoutTypeIcon type={workoutType} />
                    ) : (
                      <span></span>
                    )}
                  </div>
                  
                  {/* Day of week label moved below the circle */}
                  <span className="text-xs font-medium text-slate-600 mt-1">{day.shortName}</span>
                  
                  {/* Current day indicator */}
                  {isToday && (
                    <div className="w-1.5 h-1.5 bg-client rounded-full mt-0.5"></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <CollapsibleContent>
        <div className="mt-1 mb-4 bg-white rounded-md border shadow-sm p-3">
          <h4 className="font-medium text-sm mb-2">Weekly Workouts</h4>
          
          <div className="space-y-2">
            {weekDays.map((day, index) => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
              
              const currentDay = new Date(weekStart);
              currentDay.setDate(weekStart.getDate() + index);
              
              const dateStr = format(currentDay, 'yyyy-MM-dd');
              
              const isDayCompleted = completedDates.some(date => 
                new Date(date).toDateString() === currentDay.toDateString()
              );
              
              const isLifeHappens = lifeHappensDates.some(date => 
                new Date(date).toDateString() === currentDay.toDateString()
              );
              
              let workoutType = workoutTypesMap[dateStr];
              const workoutTitle = workoutTitlesMap[dateStr] || 'Workout';
              
              if (!workoutType && isDayCompleted && workoutTitlesMap[dateStr]) {
                workoutType = detectWorkoutTypeFromText(workoutTitlesMap[dateStr]);
              }
              
              if (!workoutType) {
                workoutType = isLifeHappens ? 'rest_day' : 'strength';
              }
              
              if (!isDayCompleted && !isLifeHappens) {
                return null;
              }
              
              return (
                <div key={`detail-${index}`} className="flex items-center p-2 bg-slate-50 rounded-md">
                  <div className="w-8 text-xs font-medium text-slate-500">{day.shortName}</div>
                  {isLifeHappens ? (
                    <div className="flex items-center">
                      <div className="bg-yellow-50 p-1 rounded-full mr-2">
                        <WorkoutTypeIcon type="rest_day" />
                      </div>
                      <span className="text-sm">Rest Day</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="bg-client/10 p-1 rounded-full mr-2">
                        <WorkoutTypeIcon type={workoutType} />
                      </div>
                      <span className="text-sm">{workoutTitle}</span>
                    </div>
                  )}
                </div>
              );
            }).filter(Boolean)}
            
            {!completedDates.length && !lifeHappensDates.length && (
              <div className="text-center text-sm text-slate-500 py-2">
                No workouts completed this week
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
