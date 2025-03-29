
import React from 'react';
import { format } from 'date-fns';
import { CalendarClock, ListChecks, CircleSlash, FileText, Heart } from 'lucide-react';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
}

export const WorkoutDayDetails: React.FC<WorkoutDayDetailsProps> = ({ date, workouts }) => {
  // Debug output to verify what workouts are being passed
  console.log(`WorkoutDayDetails - Receiving date: ${format(date, 'MM/dd/yyyy')}`);
  console.log(`WorkoutDayDetails - Receiving ${workouts.length} workouts`);
  
  // Helper function to convert workout type string to WorkoutType
  const getWorkoutType = (typeString: string | undefined): WorkoutType => {
    if (!typeString) return 'strength';
    
    const normalizedType = typeString.toLowerCase();
    if (normalizedType.includes('strength')) return 'strength';
    if (normalizedType.includes('body') || normalizedType.includes('weight')) return 'bodyweight';
    if (normalizedType.includes('cardio') || normalizedType.includes('run') || normalizedType.includes('hiit')) return 'cardio';
    if (normalizedType.includes('flex') || normalizedType.includes('yoga') || normalizedType.includes('stretch') || normalizedType.includes('recovery')) return 'flexibility';
    if (normalizedType.includes('rest')) return 'rest_day';
    if (normalizedType.includes('custom')) return 'custom';
    if (normalizedType.includes('one')) return 'one_off';
    
    return 'strength';
  };
  
  if (!workouts || workouts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm mb-8 w-full text-center">
        <CalendarClock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Workouts on {format(date, 'MMMM d, yyyy')}</h3>
        <p className="text-gray-500">No completed workouts or activities found for this day.</p>
      </div>
    );
  }

  // Check if it's just a rest day
  const isRestDay = workouts.some(w => w.rest_day);
  
  // Check if it's just a life happens pass
  const isLifeHappensPass = workouts.every(w => w.life_happens_pass);

  if (isRestDay) {
    return (
      <Card className="mb-8 bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-green-800">
            <WorkoutTypeIcon type="rest_day" />
            <span>Rest Day - {format(date, 'MMMM d, yyyy')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-green-700 mb-4">
            You took a well-deserved rest day. Recovery is an essential part of progress!
          </p>
          {workouts[0].notes && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm font-medium text-green-800 mb-2">Notes:</p>
              <p className="text-sm text-green-700">{workouts[0].notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isLifeHappensPass) {
    return (
      <Card className="mb-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-blue-800">
            <CircleSlash className="h-5 w-5 text-blue-600" />
            <span>Life Happens Pass - {format(date, 'MMMM d, yyyy')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-blue-700">
            You used a Life Happens Pass for this day. Sometimes life gets in the way, and that's okay!
          </p>
          {workouts[0].notes && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">Notes:</p>
              <p className="text-sm text-blue-700">{workouts[0].notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-8 w-full">
      <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
        <ListChecks className="h-5 w-5 text-primary" />
        <span>Workouts on {format(date, 'MMMM d, yyyy')}</span>
      </h3>
      
      <div className="space-y-4">
        {workouts.map((workout) => (
          <Card key={workout.id} className="overflow-hidden border">
            <CardHeader className="py-3 px-4 bg-gray-50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                {workout.workout?.workout_type && (
                  <WorkoutTypeIcon type={getWorkoutType(workout.workout.workout_type)} />
                )}
                <CardTitle className="text-base">{workout.workout?.title || "Untitled Workout"}</CardTitle>
              </div>
              {workout.rating && (
                <div className="flex items-center text-sm">
                  <Heart className="h-4 w-4 text-red-500 mr-1" />
                  <span>Rating: {workout.rating}/5</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="py-3 px-4">
              {workout.workout?.description && (
                <p className="text-sm text-gray-600 mb-3">{workout.workout.description}</p>
              )}
              
              {workout.workout?.workout_exercises && workout.workout.workout_exercises.length > 0 && (
                <>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <ListChecks className="h-4 w-4 text-gray-500" />
                    <span>Exercises</span>
                  </h4>
                  <ul className="text-sm space-y-1 mb-4">
                    {workout.workout.workout_exercises.slice(0, 5).map((exercise, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{exercise.exercise?.name || "Unknown Exercise"}</span>
                        <span className="text-gray-500">
                          {exercise.sets} × {exercise.reps}
                        </span>
                      </li>
                    ))}
                    {workout.workout.workout_exercises.length > 5 && (
                      <li className="text-xs text-gray-500 italic">
                        + {workout.workout.workout_exercises.length - 5} more exercises
                      </li>
                    )}
                  </ul>
                </>
              )}
              
              {workout.notes && (
                <>
                  <Separator className="my-3" />
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium mb-1">Notes</h4>
                      <p className="text-sm text-gray-600">{workout.notes}</p>
                    </div>
                  </div>
                </>
              )}
              
              <div className="text-xs text-gray-400 mt-3 text-right">
                Completed at {format(new Date(workout.completed_at), 'h:mm a')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
