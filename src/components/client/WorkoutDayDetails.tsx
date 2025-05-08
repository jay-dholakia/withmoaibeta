
import React, { useState } from 'react';
import { format } from 'date-fns';
import { WorkoutHistoryItem, WorkoutExercise, PersonalRecord } from '@/types/workout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StrengthExercise } from '@/components/client/workout/StrengthExercise';
import { Badge } from '@/components/ui/badge';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
  personalRecords: PersonalRecord[];
}

export const WorkoutDayDetails: React.FC<WorkoutDayDetailsProps> = ({ 
  date, 
  workouts,
  personalRecords 
}) => {
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const toggleWorkoutExpanded = (workoutId: string) => {
    setExpandedWorkoutId(expandedWorkoutId === workoutId ? null : workoutId);
  };

  // Function to find a personal record for a specific exercise
  const findPersonalRecord = (exerciseId: string): PersonalRecord | undefined => {
    if (!personalRecords || personalRecords.length === 0) return undefined;
    
    // Debug logging to understand what's happening
    console.log(`Looking for PR for exercise: ${exerciseId}`);
    console.log(`Available PRs:`, personalRecords);
    
    const record = personalRecords.find(pr => pr.exercise_id === exerciseId);
    if (record) {
      console.log(`Found PR:`, record);
    } else {
      console.log(`No PR found for exercise: ${exerciseId}`);
    }
    
    return record;
  };

  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No workout history found for {format(date, 'MMMM d, yyyy')}</p>
      </div>
    );
  }

  // Sort workouts by completion time, most recent first
  const sortedWorkouts = [...workouts].sort((a, b) => {
    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">{format(date, 'MMMM d, yyyy')}</h3>
      
      {sortedWorkouts.map((workout) => (
        <Card key={workout.id} className="overflow-hidden">
          <CardHeader className="p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">
                {workout.title || workout.workout?.title || 'Workout'}
              </CardTitle>
              {workout.workout_type && (
                <Badge variant="outline">{workout.workout_type}</Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-4 pt-0">
            {workout.description && (
              <p className="text-sm text-muted-foreground mb-4">{workout.description}</p>
            )}
            
            {/* Workout type-specific content */}
            {workout.life_happens_pass && (
              <div className="bg-muted p-3 rounded text-sm">Life Happens Pass Used</div>
            )}
            
            {workout.rest_day && (
              <div className="bg-muted p-3 rounded text-sm">Rest Day</div>
            )}
            
            {/* Display exercises if they exist */}
            {workout.workout?.workout_exercises && workout.workout.workout_exercises.length > 0 && (
              <div className="mt-4 space-y-4">
                <h4 className="text-sm font-medium">Exercises</h4>
                
                {workout.workout.workout_exercises.map((exercise) => (
                  <div key={exercise.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{exercise.exercise?.name || 'Exercise'}</h5>
                        {exercise.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>
                        )}
                        
                        {/* Find and pass the personal record for this exercise */}
                        {exercise.exercise && exercise.exercise.id && (
                          <StrengthExercise 
                            exercise={exercise} 
                            exerciseState={{
                              sets: Array.from({ length: exercise.sets }, (_, i) => ({
                                setNumber: i + 1,
                                weight: '',
                                reps: exercise.reps || '',
                                completed: false
                              }))
                            }}
                            personalRecord={findPersonalRecord(exercise.exercise.id)}
                            onSetChange={() => {}}
                            onSetCompletion={() => {}}
                            onVideoClick={() => {}}
                            onSwapClick={() => {}}
                          />
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">{exercise.sets} sets × {exercise.reps}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
