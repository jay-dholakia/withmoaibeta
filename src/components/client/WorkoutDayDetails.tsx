
import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarClock, ListChecks, CircleSlash, FileText, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
              
              {/* Replace notes with workout set details */}
              {workout.workout_set_completions && workout.workout_set_completions.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <Collapsible className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>Workout Details</span>
                      </div>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                        <span>View Details</span>
                        <ChevronDown className="h-3 w-3" />
                      </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent className="mt-2 space-y-3">
                      {/* Group exercises and their sets */}
                      {(() => {
                        // Create a map to group sets by exercise
                        const exerciseGroups: Record<string, { name: string; type: string; sets: any[] }> = {};
                        
                        // Group the sets by exercise ID
                        workout.workout_set_completions.forEach(set => {
                          const exerciseId = set.workout_exercise_id;
                          
                          if (!exerciseGroups[exerciseId]) {
                            // Find the exercise name by looking up the workout_exercise in the workout
                            const exerciseInfo = workout.workout?.workout_exercises?.find(
                              e => e.id === exerciseId
                            );
                            
                            exerciseGroups[exerciseId] = {
                              name: exerciseInfo?.exercise?.name || "Unknown Exercise",
                              type: exerciseInfo?.exercise?.exercise_type || "strength",
                              sets: []
                            };
                          }
                          
                          exerciseGroups[exerciseId].sets.push(set);
                        });
                        
                        // Now render each exercise group
                        return Object.entries(exerciseGroups).map(([exerciseId, group]) => (
                          <div key={exerciseId} className="rounded border border-gray-100 p-2">
                            <h5 className="text-sm font-medium">{group.name}</h5>
                            
                            {group.type === 'cardio' ? (
                              // Display cardio details
                              <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="font-medium">Distance: </span>
                                  <span>{group.sets[0]?.distance || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-medium">Duration: </span>
                                  <span>{group.sets[0]?.duration || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-medium">Location: </span>
                                  <span className="capitalize">{group.sets[0]?.location || 'N/A'}</span>
                                </div>
                              </div>
                            ) : group.type === 'flexibility' ? (
                              // Display flexibility details
                              <div className="mt-1 text-xs">
                                <span className="font-medium">Duration: </span>
                                <span>{group.sets[0]?.duration || 'N/A'}</span>
                              </div>
                            ) : (
                              // Display strength/bodyweight sets
                              <div className="mt-1 space-y-1">
                                {group.sets.sort((a, b) => a.set_number - b.set_number).map((set) => (
                                  <div key={set.id} className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <span className="font-medium">Set {set.set_number}: </span>
                                    </div>
                                    <div>
                                      {set.reps_completed && (
                                        <span>{set.reps_completed} reps</span>
                                      )}
                                    </div>
                                    <div>
                                      {set.weight && (
                                        <span>{set.weight} lbs</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </CollapsibleContent>
                  </Collapsible>
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
