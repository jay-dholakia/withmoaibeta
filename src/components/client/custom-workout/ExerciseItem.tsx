
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import { CustomExerciseItem } from './types';

interface ExerciseItemProps {
  exercise: CustomExerciseItem;
  index: number;
  updateExercise: (index: number, updates: Partial<CustomExerciseItem>) => void;
  handleRemoveExercise: (index: number) => void;
  isCardio: boolean;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({ 
  exercise, 
  index, 
  updateExercise, 
  handleRemoveExercise,
  isCardio
}) => {
  return (
    <Card className="p-4 shadow-xl">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {exercise.exercise ? (
              <h3 className="font-medium">{exercise.exercise.name}</h3>
            ) : (
              <div className="space-y-1">
                <Label htmlFor={`custom-${index}`}>Exercise Name *</Label>
                <Input 
                  id={`custom-${index}`}
                  value={exercise.customName || ''} 
                  onChange={(e) => {
                    const newName = e.target.value;
                    const updates: Partial<CustomExerciseItem> = { 
                      customName: newName
                    };
                    
                    const wasCardio = exercise.customName ? isCardioExercise(exercise.customName) : false;
                    const isNowCardio = isCardioExercise(newName);
                    
                    if (wasCardio !== isNowCardio) {
                      if (isNowCardio) {
                        updates.sets = undefined;
                        updates.reps = undefined;
                        updates.rest = undefined;
                      } else {
                        updates.sets = 3;
                        updates.reps = '10';
                        updates.rest = 60;
                      }
                    }
                    
                    updateExercise(index, updates);
                  }}
                  placeholder="Custom exercise name" 
                  required={!exercise.exercise}
                />
              </div>
            )}
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => handleRemoveExercise(index)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {!isCardio && (
            <>
              <div className="space-y-1">
                <Label htmlFor={`sets-${index}`}>Sets</Label>
                <Input 
                  id={`sets-${index}`}
                  type="number" 
                  min="1"
                  value={exercise.sets || ''} 
                  onChange={(e) => updateExercise(index, { 
                    sets: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="3" 
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor={`reps-${index}`}>Reps</Label>
                <Input 
                  id={`reps-${index}`}
                  value={exercise.reps || ''} 
                  onChange={(e) => updateExercise(index, { reps: e.target.value })}
                  placeholder="10" 
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor={`rest-${index}`}>Rest (seconds)</Label>
                <Input 
                  id={`rest-${index}`}
                  type="number" 
                  min="0"
                  value={exercise.rest || ''} 
                  onChange={(e) => updateExercise(index, { 
                    rest: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="60" 
                />
              </div>
            </>
          )}
          
          {isCardio && (
            <div className="col-span-3">
              <p className="text-sm text-muted-foreground">No sets, reps or rest needed for cardio exercises.</p>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor={`notes-${index}`}>Notes</Label>
          <Textarea 
            id={`notes-${index}`}
            value={exercise.notes || ''} 
            onChange={(e) => updateExercise(index, { notes: e.target.value })}
            placeholder={isCardio 
              ? "Enter distance, duration, or other details..." 
              : "Any specific instructions or notes..."} 
            rows={2}
          />
        </div>
      </div>
    </Card>
  );
};

// Helper function to determine if an exercise is cardio
export const isCardioExercise = (exerciseName: string): boolean => {
  const name = exerciseName.toLowerCase();
  return name.includes('run') || name.includes('walk');
};
