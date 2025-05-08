
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dumbbell, Plus } from 'lucide-react';
import { ExerciseSelector } from '@/components/coach/ExerciseSelector';
import { Exercise } from '@/types/workout';
import { ExerciseItem, isCardioExercise } from './ExerciseItem';
import { CustomExerciseItem } from './types';
import { Separator } from '@/components/ui/separator';

interface ExerciseListProps {
  exercises: CustomExerciseItem[];
  updateExercise: (index: number, updates: Partial<CustomExerciseItem>) => void;
  handleRemoveExercise: (index: number) => void;
  handleAddExercise: (exercise: Exercise) => void;
  handleAddCustomExercise: () => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  updateExercise,
  handleRemoveExercise,
  handleAddExercise,
  handleAddCustomExercise
}) => {
  return (
    <div className="space-y-4">
      <Separator />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Exercises (Optional)</h2>
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAddCustomExercise}
          >
            <Plus className="h-4 w-4 mr-2" />
            Custom Exercise
          </Button>
          <ExerciseSelector 
            onSelectExercise={handleAddExercise} 
            buttonText="Add Exercise"
          />
        </div>
      </div>
      
      {exercises.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p>No exercises added yet. You can create a workout without exercises, or use the buttons above to add them.</p>
        </div>
      )}
      
      <div className="space-y-4">
        {exercises.map((exercise, index) => {
          const exerciseName = exercise.exercise?.name || exercise.customName || '';
          const isCardio = isCardioExercise(exerciseName);
          
          return (
            <ExerciseItem 
              key={exercise.id}
              exercise={exercise}
              index={index}
              updateExercise={updateExercise}
              handleRemoveExercise={handleRemoveExercise}
              isCardio={isCardio}
            />
          );
        })}
      </div>
    </div>
  );
};
