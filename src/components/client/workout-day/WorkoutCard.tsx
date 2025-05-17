
import React, { useEffect } from 'react';
import { WorkoutHistoryItem, WorkoutExercise, PersonalRecord } from '@/types/workout';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { WorkoutHeader } from './WorkoutHeader';
import { SpecialWorkoutContent } from './SpecialWorkoutContent';
import { ExerciseList } from './ExerciseList';
import { WorkoutJournal } from './WorkoutJournal';

interface WorkoutCardProps {
  workout: WorkoutHistoryItem;
  personalRecords: PersonalRecord[];
  exerciseStates: {
    [workoutId: string]: {
      [exerciseId: string]: {
        sets: Array<{
          setNumber: number;
          weight: string;
          reps: string;
          completed: boolean;
        }>;
      }
    }
  };
  isDeleting: { [key: string]: boolean };
  isUpdatingDate: { [key: string]: boolean };
  onDeleteWorkout: (workoutId: string) => Promise<void>;
  onUpdateWorkoutDate: (workoutId: string, newDate: Date) => Promise<void>;
  onSetChange: (workoutId: string, exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => void;
  onSetCompletion: (workoutId: string, exerciseId: string, setIndex: number, completed: boolean) => void;
  initializeExerciseState: (workout: WorkoutHistoryItem) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  personalRecords,
  exerciseStates,
  isDeleting,
  isUpdatingDate,
  onDeleteWorkout,
  onUpdateWorkoutDate,
  onSetChange,
  onSetCompletion,
  initializeExerciseState
}) => {
  // Initialize exercise states when rendering a workout
  useEffect(() => {
    initializeExerciseState(workout);
  }, [workout, initializeExerciseState]);

  return (
    <Card key={workout.id} className="overflow-hidden">
      <CardHeader className="p-4">
        <WorkoutHeader
          title={workout.title || workout.workout?.title || 'Workout'}
          workoutType={workout.workout_type}
          workoutId={workout.id}
          completedAt={workout.completed_at}
          isDeleting={isDeleting[workout.id] || false}
          isUpdatingDate={isUpdatingDate[workout.id] || false}
          onDelete={onDeleteWorkout}
          onUpdateDate={onUpdateWorkoutDate}
        />
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {workout.description && (
          <p className="text-sm text-muted-foreground mb-4">{workout.description}</p>
        )}
        
        {/* Workout type-specific content */}
        <SpecialWorkoutContent 
          isLifeHappensPass={workout.life_happens_pass}
          isRestDay={workout.rest_day}
        />
        
        {/* Display exercises if they exist */}
        {workout.workout?.workout_exercises && workout.workout.workout_exercises.length > 0 && (
          <ExerciseList
            exercises={workout.workout.workout_exercises}
            exerciseStates={exerciseStates[workout.id] || {}}
            personalRecords={personalRecords}
            onSetChange={onSetChange}
            onSetCompletion={onSetCompletion}
            workoutId={workout.id}
          />
        )}

        {/* Journal Notes Section */}
        <WorkoutJournal notes={workout.notes} />
      </CardContent>
    </Card>
  );
};
