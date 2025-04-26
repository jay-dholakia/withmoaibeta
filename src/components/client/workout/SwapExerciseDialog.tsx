
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Exercise } from "@/types/workout";
import { Loader2 } from "lucide-react";

interface SwapExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  muscleGroup: string;
  similarExercises: Exercise[] | undefined;
  isLoading: boolean;
  onSwapSelect: (exercise: Exercise) => void;
}

export const SwapExerciseDialog: React.FC<SwapExerciseDialogProps> = ({
  isOpen,
  onClose,
  exerciseName,
  muscleGroup,
  similarExercises,
  isLoading,
  onSwapSelect,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Swap "{exerciseName}"</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select another {muscleGroup} exercise to swap with:
          </p>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : similarExercises && similarExercises.length > 0 ? (
            <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
              {similarExercises.map((exercise) => (
                <Button
                  key={exercise.id}
                  variant="outline"
                  className="w-full justify-between text-left h-auto py-3"
                  onClick={() => {
                    onSwapSelect(exercise);
                    onClose();
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{exercise.name}</span>
                    {exercise.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {exercise.description}
                      </span>
                    )}
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded ml-2 whitespace-nowrap">
                    {exercise.muscle_group}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No alternative exercises found for this muscle group
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapExerciseDialog;
