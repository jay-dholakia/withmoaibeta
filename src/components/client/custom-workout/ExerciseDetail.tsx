
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomWorkoutExercise } from '@/services/clients/custom-workout/types';

interface ExerciseDetailProps {
  exercise: CustomWorkoutExercise;
  index: number;
  totalExercises: number;
  isReordering: boolean;
  isEditing: boolean;
  handleMoveExerciseUp: (exerciseId: string) => void;
  handleMoveExerciseDown: (exerciseId: string) => void;
}

export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
  exercise,
  index,
  totalExercises,
  isReordering,
  isEditing,
  handleMoveExerciseUp,
  handleMoveExerciseDown
}) => {
  return (
    <Card key={exercise.id}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">
              {exercise.exercise?.name || exercise.custom_exercise_name || 'Unnamed Exercise'}
            </h3>
            
            <div className="flex flex-wrap gap-x-4 mt-2 text-sm">
              {exercise.sets && (
                <div className="text-muted-foreground">
                  <span className="font-medium">Sets:</span> {exercise.sets}
                </div>
              )}
              
              {exercise.reps && (
                <div className="text-muted-foreground">
                  <span className="font-medium">Reps:</span> {exercise.reps}
                </div>
              )}
              
              {exercise.rest_seconds && (
                <div className="text-muted-foreground">
                  <span className="font-medium">Rest:</span> {exercise.rest_seconds}s
                </div>
              )}
            </div>
            
            {exercise.notes && (
              <div className="mt-2 text-sm">
                <div className="font-medium">Notes:</div>
                <p className="text-muted-foreground">{exercise.notes}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-8 w-8" 
              onClick={() => handleMoveExerciseUp(exercise.id)}
              disabled={index === 0 || isReordering || isEditing}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Move up</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-8 w-8" 
              onClick={() => handleMoveExerciseDown(exercise.id)}
              disabled={index === totalExercises - 1 || isReordering || isEditing}
            >
              <ArrowDown className="h-4 w-4" />
              <span className="sr-only">Move down</span>
            </Button>
            
            <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground font-medium">
              {index + 1}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
