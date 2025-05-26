
import React from 'react';
import { WorkoutExercise, PersonalRecord } from '@/types/workout';
import { StrengthExercise } from '@/components/client/workout/StrengthExercise';

interface ExerciseState {
  sets: Array<{
    setNumber: number;
    weight: string;
    reps: string;
    completed: boolean;
  }>;
}

interface ExerciseListProps {
  exercises: WorkoutExercise[];
  exerciseStates: {
    [exerciseId: string]: ExerciseState;
  };
  personalRecords: PersonalRecord[];
  onSetChange: (workoutId: string, exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => void;
  onSetCompletion: (workoutId: string, exerciseId: string, setIndex: number, completed: boolean) => void;
  workoutId: string;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  exerciseStates,
  personalRecords,
  onSetChange,
  onSetCompletion,
  workoutId,
}) => {
  // Function to find a personal record for a specific exercise
  const findPersonalRecord = (exerciseId: string): PersonalRecord | undefined => {
    if (!personalRecords || personalRecords.length === 0) return undefined;
    return personalRecords.find(pr => pr.exercise_id === exerciseId);
  };

  if (!exercises || exercises.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      <h4 className="text-sm font-medium">Exercises</h4>
      
      {exercises.map((exercise) => (
        <div key={exercise.id} className="border rounded-md p-3">
          <div className="flex justify-between items-start">
            <div className="w-full">
              <h5 className="font-medium">{exercise.exercise?.name || 'Exercise'}</h5>
              {exercise.notes && (
                <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>
              )}
              
              {exercise.exercise && exercise.exercise.id && (
                <div className="mt-2">
                  <StrengthExercise 
                    exercise={exercise} 
                    exerciseState={
                      exerciseStates[exercise.id] || {
                        sets: Array.from({ length: exercise.sets }, (_, i) => ({
                          setNumber: i + 1,
                          weight: '',
                          reps: exercise.reps || '',
                          completed: false
                        }))
                      }
                    }
                    personalRecord={findPersonalRecord(exercise.exercise.id)}
                    onSetChange={(exerciseId, setIndex, field, value) => 
                      onSetChange(workoutId, exerciseId, setIndex, field, value)
                    }
                    onSetCompletion={(exerciseId, setIndex, completed) => 
                      onSetCompletion(workoutId, exerciseId, setIndex, Boolean(completed))
                    }
                    onVideoClick={() => {}}
                    onSwapClick={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
