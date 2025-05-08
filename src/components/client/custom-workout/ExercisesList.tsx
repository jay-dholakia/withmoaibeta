
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { ExerciseDetail } from './ExerciseDetail';
import { CustomWorkoutExercise } from '@/services/clients/custom-workout/types';

interface ExercisesListProps {
  exercises: CustomWorkoutExercise[];
  isReordering: boolean;
  isEditing: boolean;
  handleMoveExerciseUp: (exerciseId: string) => void;
  handleMoveExerciseDown: (exerciseId: string) => void;
}

export const ExercisesList: React.FC<ExercisesListProps> = ({
  exercises,
  isReordering,
  isEditing,
  handleMoveExerciseUp,
  handleMoveExerciseDown,
}) => {
  return (
    <div className="space-y-4">
      <Separator />
      
      <h2 className="text-xl font-semibold">Exercises</h2>
      
      {exercises.length === 0 ? (
        <p className="text-muted-foreground">No exercises found in this workout.</p>
      ) : (
        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <ExerciseDetail
              key={exercise.id}
              exercise={exercise}
              index={index}
              totalExercises={exercises.length}
              isReordering={isReordering}
              isEditing={isEditing}
              handleMoveExerciseUp={handleMoveExerciseUp}
              handleMoveExerciseDown={handleMoveExerciseDown}
            />
          ))}
        </div>
      )}
    </div>
  );
};
