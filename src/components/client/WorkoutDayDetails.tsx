import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarClock, ListChecks, CircleSlash, FileText, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { WorkoutHistoryItem, WorkoutSetCompletion } from '@/types/workout';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import EditWorkoutSetCompletions from './EditWorkoutSetCompletions';
import { getExerciseInfoByWorkoutExerciseId } from '@/services/workout-edit-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
}

export const WorkoutDayDetails: React.FC<WorkoutDayDetailsProps> = ({ date, workouts }) => {
  console.log(`WorkoutDayDetails - Receiving date: ${format(date, 'MM/dd/yyyy')}`);
  console.log(`WorkoutDayDetails - Receiving ${workouts.length} workouts`);
  
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutHistoryItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [exerciseGroups, setExerciseGroups] = useState<Record<string, { name: string; type: string; sets: WorkoutSetCompletion[] }>>({});
  const [exerciseNameCache, setExerciseNameCache] = useState<Record<string, { name: string; type: string }>>({});
  const [loadingExercises, setLoadingExercises] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

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

  const [exercisesMap, setExercisesMap] = useState<Map<string, { name: string; type: string }>>(new Map());

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('id, name, exercise_type')
          .order('name');
          
        if (error) {
          console.error('Error fetching exercises:', error);
          return;
        }
        
        const exerciseMap = new Map();
        if (data) {
          data.forEach(exercise => {
            exerciseMap.set(exercise.id, {
              name: exercise.name,
              type: exercise.exercise_type || 'strength'
            });
          });
        }
        
        setExercisesMap(exerciseMap);
        console.log('Loaded exercise map with', exerciseMap.size, 'exercises');
      } catch (err) {
        console.error('Failed to fetch exercises:', err);
      }
    };
    
    fetchExercises();
  }, []);

  const findExerciseInfo = async (workout_exercise_id: string, workout: WorkoutHistoryItem) => {
    console.log(`Looking for exercise with workout_exercise_id: ${workout_exercise_id}`);
    
    setLoadingExercises(prev => ({ ...prev, [workout_exercise_id]: true }));
    
    if (exerciseNameCache[workout_exercise_id]) {
      setLoadingExercises(prev => ({ ...prev, [workout_exercise_id]: false }));
      return exerciseNameCache[workout_exercise_id];
    }
    
    try {
      if (workout.workout?.workout_exercises) {
        const matchingWorkoutExercise = workout.workout.workout_exercises.find(
          we => we.id === workout_exercise_id
        );
        
        if (matchingWorkoutExercise) {
          console.log(`Found matching workout_exercise with id ${matchingWorkoutExercise.id}`);
          
          if (matchingWorkoutExercise.exercise) {
            console.log(`Found exercise directly: ${matchingWorkoutExercise.exercise.name}`);
            const exerciseInfo = {
              name: matchingWorkoutExercise.exercise.name,
              type: matchingWorkoutExercise.exercise.exercise_type || "strength"
            };
            
            setExerciseNameCache(prev => ({
              ...prev,
              [workout_exercise_id]: exerciseInfo
            }));
            
            setLoadingExercises(prev => ({ ...prev, [workout_exercise_id]: false }));
            return exerciseInfo;
          }
          
          if (matchingWorkoutExercise.exercise_id && exercisesMap.has(matchingWorkoutExercise.exercise_id)) {
            const exerciseInfo = exercisesMap.get(matchingWorkoutExercise.exercise_id);
            console.log(`Found exercise in map by exercise_id: ${exerciseInfo?.name}`);
            
            if (exerciseInfo) {
              setExerciseNameCache(prev => ({
                ...prev,
                [workout_exercise_id]: exerciseInfo
              }));
              
              setLoadingExercises(prev => ({ ...prev, [workout_exercise_id]: false }));
              return exerciseInfo;
            }
          }
        }
      }
      
      const exerciseInfo = await getExerciseInfoByWorkoutExerciseId(workout_exercise_id);
      if (exerciseInfo) {
        setExerciseNameCache(prev => ({
          ...prev,
          [workout_exercise_id]: exerciseInfo
        }));
        
        console.log(`Found exercise via service lookup: ${exerciseInfo.name}`);
        setLoadingExercises(prev => ({ ...prev, [workout_exercise_id]: false }));
        return exerciseInfo;
      }
      
      if (workout.workout_set_completions) {
        const exerciseIds = [...new Set(workout.workout_set_completions.map(set => set.workout_exercise_id))];
        const index = exerciseIds.indexOf(workout_exercise_id);
        if (index !== -1) {
          const fallbackInfo = { name: `Exercise ${index + 1}`, type: "strength" };
          
          setExerciseNameCache(prev => ({
            ...prev,
            [workout_exercise_id]: fallbackInfo
          }));
          
          setLoadingExercises(prev => ({ ...prev, [workout_exercise_id]: false }));
          return fallbackInfo;
        }
      }
      
      const defaultInfo = { name: "Exercise", type: "strength" };
      
      setExerciseNameCache(prev => ({
        ...prev,
        [workout_exercise_id]: defaultInfo
      }));
      
      setLoadingExercises(prev => ({ ...prev, [workout_exercise_id]: false }));
      return defaultInfo;
    } catch (error) {
      console.error("Error fetching exercise info:", error);
      
      const errorInfo = { name: "Unknown Exercise", type: "strength" };
      setExerciseNameCache(prev => ({
        ...prev,
        [workout_exercise_id]: errorInfo
      }));
      
      setLoadingExercises(prev => ({ ...prev, [workout_exercise_id]: false }));
      return errorInfo;
    }
  };

  const handleEditWorkout = async (workout: WorkoutHistoryItem) => {
    if (!workout.workout_set_completions || workout.workout_set_completions.length === 0) {
      return;
    }
    
    const groups: Record<string, { name: string; type: string; sets: WorkoutSetCompletion[] }> = {};
    
    const exerciseIds = [...new Set(workout.workout_set_completions.map(set => set.workout_exercise_id))];
    
    for (const exerciseId of exerciseIds) {
      const exerciseInfo = await findExerciseInfo(exerciseId, workout);
      
      groups[exerciseId] = {
        name: exerciseInfo.name,
        type: exerciseInfo.type,
        sets: workout.workout_set_completions.filter(set => set.workout_exercise_id === exerciseId)
      };
      
      groups[exerciseId].sets.sort((a, b) => a.set_number - b.set_number);
    }
    
    setExerciseGroups(groups);
    setCurrentWorkout(workout);
    setEditDialogOpen(true);
  };

  useEffect(() => {
    if (!workouts || workouts.length === 0) return;
    
    const prefetchExerciseInfo = async () => {
      for (const workout of workouts) {
        if (!workout.workout_set_completions) continue;
        
        const exerciseIds = [...new Set(workout.workout_set_completions.map(set => set.workout_exercise_id))];
        
        await Promise.all(exerciseIds.map(id => findExerciseInfo(id, workout)));
      }
    };
    
    prefetchExerciseInfo();
  }, [workouts]);

  const refreshWorkoutData = async () => {
    setEditDialogOpen(false);
    setCurrentWorkout(null);
    
    const refreshButton = document.getElementById('refresh-workout-history');
    if (refreshButton) {
      refreshButton.click();
    }
  };

  const isCurrentUserOwner = (workoutUserId: string) => {
    return user?.id === workoutUserId;
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

  const isRestDay = workouts.some(w => w.rest_day);

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
          {workouts[0].notes && isCurrentUserOwner(workouts[0].user_id) && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm font-medium text-green-800 mb-2">Notes:</p>
              <p className="text-sm text-green-700">{workouts[0].notes}</p>
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
              <div className="flex items-center gap-2">
                {workout.workout_set_completions && 
                 workout.workout_set_completions.length > 0 && 
                 isCurrentUserOwner(workout.user_id) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-blue-600 hover:text-blue-800"
                    onClick={() => handleEditWorkout(workout)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="text-xs">Edit</span>
                  </Button>
                )}
              </div>
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
              
              {workout.workout_set_completions && 
               workout.workout_set_completions.length > 0 && 
               isCurrentUserOwner(workout.user_id) && (
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
                      {(() => {
                        const exerciseGroups: Record<string, { name: string; type: string; sets: WorkoutSetCompletion[] }> = {};
                        
                        const exerciseIds = [...new Set(workout.workout_set_completions.map(set => set.workout_exercise_id))];
                        
                        exerciseIds.forEach(id => {
                          const cachedInfo = exerciseNameCache[id];
                          exerciseGroups[id] = {
                            name: cachedInfo ? cachedInfo.name : loadingExercises[id] ? "Loading..." : "Exercise",
                            type: cachedInfo ? cachedInfo.type : "strength",
                            sets: workout.workout_set_completions!.filter(set => set.workout_exercise_id === id)
                          };
                          
                          exerciseGroups[id].sets.sort((a, b) => a.set_number - b.set_number);
                          
                          if (!cachedInfo && !loadingExercises[id]) {
                            findExerciseInfo(id, workout).then(() => {
                            });
                          }
                        });
                        
                        return Object.entries(exerciseGroups).map(([exerciseId, group]) => (
                          <div key={exerciseId} className="rounded border border-gray-100 p-2">
                            {loadingExercises[exerciseId] ? (
                              <div className="mb-2">
                                <Skeleton className="h-5 w-24" />
                              </div>
                            ) : (
                              <h5 className="text-sm font-medium">{group.name}</h5>
                            )}
                            
                            {group.type === 'cardio' ? (
                              <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
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
                              <div className="mt-1 text-xs">
                                <span className="font-medium">Duration: </span>
                                <span>{group.sets[0]?.duration || 'N/A'}</span>
                              </div>
                            ) : (
                              <div className="mt-1 space-y-1">
                                {group.sets.map((set) => (
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
      
      {currentWorkout && (
        <EditWorkoutSetCompletions
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          workout={currentWorkout}
          exerciseGroups={exerciseGroups}
          onSave={refreshWorkoutData}
        />
      )}
    </div>
  );
};
