
import React from 'react';
import { Exercise } from '@/types/workout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { fetchExercisesByMuscleGroup } from '@/services/exercise-service';
import { Loader2 } from 'lucide-react';

interface ExerciseSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExercise: Exercise;
  onSwapSelect: (newExercise: Exercise) => void;
}

export function ExerciseSwapDialog({
  open,
  onOpenChange,
  currentExercise,
  onSwapSelect,
}: ExerciseSwapDialogProps) {
  const { data: exerciseOptions, isLoading } = useQuery({
    queryKey: ['exercises', currentExercise.muscle_group],
    queryFn: () => fetchExercisesByMuscleGroup(currentExercise.muscle_group || ''),
    enabled: !!currentExercise.muscle_group && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Swap Exercise</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {exerciseOptions?.filter(ex => ex.id !== currentExercise.id).map((exercise) => (
                <Button
                  key={exercise.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => onSwapSelect(exercise)}
                >
                  <div className="text-left">
                    <div className="font-medium">{exercise.name}</div>
                    {exercise.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {exercise.description}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
              {(!exerciseOptions || exerciseOptions.length <= 1) && (
                <div className="text-center py-4 text-muted-foreground">
                  No alternative exercises found for this muscle group
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
