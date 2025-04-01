
import React from 'react';
import { format, isValid } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clipboard, XCircle, Edit, Plus } from 'lucide-react';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import { Button } from '@/components/ui/button';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
}

export const WorkoutDayDetails: React.FC<WorkoutDayDetailsProps> = ({ date, workouts }) => {
  // Format date for display and URL
  let dateLabel = '';
  let formattedDateForUrl = '';
  
  try {
    if (date && isValid(date)) {
      dateLabel = format(date, 'MMMM d, yyyy');
      formattedDateForUrl = format(date, 'yyyy-MM-dd');
    } else {
      dateLabel = 'Invalid Date';
    }
  } catch (err) {
    console.error('Error formatting date:', err);
    dateLabel = 'Date Error';
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{dateLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <div>
              <p className="text-muted-foreground">No workouts recorded for this day.</p>
              <p className="text-sm text-muted-foreground">Select a different day or add a custom workout for this date.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div key={workout.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <WorkoutTypeIcon 
                        type={workout.workout?.workout_type || 'strength'} 
                        className="h-7 w-7 p-1 rounded-full bg-muted" 
                      />
                      <div>
                        <h4 className="font-medium truncate max-w-[200px]">
                          {workout.workout?.title || workout.title || 'Untitled Workout'}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {workout.rest_day && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              Rest Day
                            </Badge>
                          )}
                          {workout.life_happens_pass && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              Life Happens Pass
                            </Badge>
                          )}
                          {workout.rating && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                              Rating: {workout.rating}/5
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {workout.workout_id && !workout.rest_day && !workout.life_happens_pass && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                        <Link to={`/client-dashboard/workouts/complete/${workout.id}`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Workout</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                  
                  {workout.notes && (
                    <div className="bg-muted p-2 rounded-md text-sm">
                      <div className="flex gap-1 items-start">
                        <Clipboard className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-muted-foreground whitespace-pre-wrap text-xs">
                          {workout.notes}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {workout.workout?.workout_type === 'cardio' && workout.distance && (
                    <div className="text-xs text-muted-foreground">
                      Distance: {workout.distance}
                    </div>
                  )}
                  
                  {workout.duration && (
                    <div className="text-xs text-muted-foreground">
                      Duration: {workout.duration}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Add Custom Workout Button */}
        <div className="mt-4 pt-4 border-t">
          <Button asChild variant="outline" className="w-full flex items-center justify-center gap-2">
            <Link 
              to={`/client-dashboard/workouts/one-off?date=${formattedDateForUrl}`}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Custom Workout for This Day
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
