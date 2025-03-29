
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
  
  if (workouts.length > 0 && workouts[0].workout_set_completions) {
    console.log('First workout has set completions:', workouts[0].workout_set_completions.length);
    
    // Log the first few workout_set_completions for inspection
    workouts[0].workout_set_completions.slice(0, 3).forEach((completion, idx) => {
      console.log(`Completion ${idx}:`, {
        id: completion.id,
        exercise_id: completion.workout_exercise_id,
        set_number: completion.set_number,
        reps: completion.reps_completed,
        weight: completion.weight
      });
    });
    
    // Log workout exercises from the workout object if available
    if (workouts[0].workout?.workout_exercises) {
      console.log('Workout exercises available:', workouts[0].workout.workout_exercises.length);
      workouts[0].workout.workout_exercises.forEach((ex, idx) => {
        console.log(`Exercise ${idx}:`, {
          id: ex.id,
          name: ex.exercise?.name || 'N/A',
          exercise_id: ex.exercise_id
        });
      });
    } else {
      console.log('No workout exercises available in workout object');
    }
  }
  
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

  // Enhanced helper function for exercise lookup - fixed to handle multiple ID scenarios
  const findExerciseInfo = (workout_exercise_id: string, workout: WorkoutHistoryItem) => {
    console.log(`Looking for exercise with workout_exercise_id: ${workout_exercise_id}`);
    
    // Create a comprehensive map of all exercises with various ID mappings
    const exerciseMap = new Map();
    
    // First, collect all exercises from all workouts in this day to create a complete mapping
    for (const w of workouts) {
      if (w.workout?.workout_exercises) {
        for (const exercise of w.workout.workout_exercises) {
          // Map by workout_exercise.id
          if (exercise.id) {
            exerciseMap.set(exercise.id, {
              name: exercise.exercise?.name || "Unknown Exercise",
              type: exercise.exercise?.exercise_type || "strength"
            });
            console.log(`Added mapping for exercise.id ${exercise.id} -> ${exercise.exercise?.name || "Unknown"}`);
          }
          
          // Map by exercise.id (from the exercises table)
          if (exercise.exercise_id) {
            exerciseMap.set(exercise.exercise_id, {
              name: exercise.exercise?.name || "Unknown Exercise",
              type: exercise.exercise?.exercise_type || "strength"
            });
            console.log(`Added mapping for exercise_id ${exercise.exercise_id} -> ${exercise.exercise?.name || "Unknown"}`);
          }
          
          // Map by the exercise's own id if it exists
          if (exercise.exercise?.id) {
            exerciseMap.set(exercise.exercise.id, {
              name: exercise.exercise.name || "Unknown Exercise",
              type: exercise.exercise.exercise_type || "strength"
            });
            console.log(`Added mapping for exercise.exercise.id ${exercise.exercise.id} -> ${exercise.exercise.name || "Unknown"}`);
          }
        }
      }
      
      // Also check set completions for any additional exercise ID references
      if (w.workout_set_completions) {
        const completionExerciseIds = new Set(w.workout_set_completions.map(sc => sc.workout_exercise_id));
        console.log(`Found these unique IDs in completions: ${Array.from(completionExerciseIds).join(', ')}`);
      }
    }
    
    console.log(`Built exercise map with ${exerciseMap.size} entries`);
    
    // Try direct match in the map
    if (exerciseMap.has(workout_exercise_id)) {
      const info = exerciseMap.get(workout_exercise_id);
      console.log(`Direct match found for ${workout_exercise_id}: ${info.name}`);
      return info;
    }
    
    // If not found directly, try to infer from set completions and workout exercises
    for (const w of workouts) {
      // Look within the current workout's exercises
      if (w.workout?.workout_exercises) {
        for (const exercise of w.workout.workout_exercises) {
          // Check every possible ID field
          if (exercise.id === workout_exercise_id || 
              exercise.exercise_id === workout_exercise_id ||
              (exercise.exercise && exercise.exercise.id === workout_exercise_id)) {
            console.log(`Found match for ${workout_exercise_id} in workout exercises: ${exercise.exercise?.name || "Unknown"}`);
            return {
              name: exercise.exercise?.name || "Unknown Exercise",
              type: exercise.exercise?.exercise_type || "strength"
            };
          }
        }
      }
      
      // Try matching in set completions
      if (w.workout_set_completions) {
        const matchingCompletion = w.workout_set_completions.find(
          sc => sc.workout_exercise_id === workout_exercise_id
        );
        
        if (matchingCompletion && w.workout?.workout_exercises) {
          // Check if it's an existing workout for a rough guess based on position/order
          const exerciseIndex = w.workout_set_completions.findIndex(
            sc => sc.workout_exercise_id === workout_exercise_id
          );
          
          if (exerciseIndex >= 0 && exerciseIndex < w.workout.workout_exercises.length) {
            const potentialExercise = w.workout.workout_exercises[exerciseIndex];
            console.log(`Position-based match for ${workout_exercise_id}: ${potentialExercise.exercise?.name || "Unknown"}`);
            return {
              name: potentialExercise.exercise?.name || "Unknown Exercise",
              type: potentialExercise.exercise?.exercise_type || "strength"
            };
          }
        }
      }
    }
    
    // Fallback for cardio/flexibility workouts that might not have proper exercise links
    const completions = workout.workout_set_completions || [];
    const matchingCompletion = completions.find(c => c.workout_exercise_id === workout_exercise_id);
    
    if (matchingCompletion) {
      // Check if it has cardio or flexibility indicators
      if (matchingCompletion.distance || matchingCompletion.duration) {
        const exerciseType = matchingCompletion.distance ? "cardio" : "flexibility";
        const name = matchingCompletion.distance ? "Cardio Workout" : "Flexibility Session";
        
        console.log(`Inferred ${exerciseType} workout for ${workout_exercise_id}`);
        return { name, type: exerciseType };
      }
    }
    
    // Last resort - try to guess based on the workout type
    if (workout.workout?.workout_type) {
      const workoutType = workout.workout.workout_type.toLowerCase();
      if (workoutType.includes('cardio')) {
        return { name: "Cardio Exercise", type: "cardio" };
      } else if (workoutType.includes('flex')) {
        return { name: "Flexibility Exercise", type: "flexibility" };
      }
    }
    
    // If all else fails, return a generic exercise based on pattern in ID
    // This helps avoid "Unknown Exercise" in the UI
    const idStart = workout_exercise_id.substring(0, 8);
    console.log(`No match found for ${workout_exercise_id}, using generic name with ID prefix ${idStart}`);
    return {
      name: `Exercise ${idStart}`,
      type: "strength"
    };
  };

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
              
              {/* Display workout set details */}
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
                            // Find exercise info using our helper function
                            const exerciseInfo = findExerciseInfo(exerciseId, workout);
                            
                            exerciseGroups[exerciseId] = {
                              name: exerciseInfo.name,
                              type: exerciseInfo.type,
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
