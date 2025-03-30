
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MoveVertical, X } from 'lucide-react';
import { toast } from "sonner";
import { 
  createStandaloneSupersetGroup, 
  addExerciseToStandaloneSupersetGroup,
  removeExerciseFromStandaloneSupersetGroup,
  updateExerciseStandaloneSupersetOrder,
  deleteStandaloneSupersetGroup
} from '@/services/workout-service';

interface StandaloneSupersetManagerProps {
  workoutId: string;
  exercises: any[];
  onSupersetCreated: () => void;
  onError: (message: string) => void;
}

const StandaloneSupersetManager: React.FC<StandaloneSupersetManagerProps> = ({
  workoutId,
  exercises,
  onSupersetCreated,
  onError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [supersetName, setSupersetName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out exercises that are already in supersets
  const availableExercises = exercises.filter(ex => !ex.superset_group_id);

  const handleCreateSuperset = async () => {
    if (selectedExercises.length < 2) {
      toast.error('Please select at least 2 exercises for a superset');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Create superset group
      const supersetGroup = await createStandaloneSupersetGroup({
        workout_id: workoutId,
        title: supersetName.trim() || 'Superset'
      });

      // 2. Add exercises to the superset group
      for (let i = 0; i < selectedExercises.length; i++) {
        await addExerciseToStandaloneSupersetGroup(selectedExercises[i], supersetGroup.id, i);
      }

      toast.success('Superset created successfully');
      setIsOpen(false);
      setSupersetName('');
      setSelectedExercises([]);
      onSupersetCreated();
    } catch (error) {
      console.error('Error creating superset:', error);
      onError('Failed to create superset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    if (selectedExercises.includes(exerciseId)) {
      setSelectedExercises(selectedExercises.filter(id => id !== exerciseId));
    } else {
      setSelectedExercises([...selectedExercises, exerciseId]);
    }
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === selectedExercises.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSelected = [...selectedExercises];
    [newSelected[index], newSelected[newIndex]] = [newSelected[newIndex], newSelected[index]];
    setSelectedExercises(newSelected);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Superset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Superset</DialogTitle>
          <DialogDescription>
            Group exercises to be performed back-to-back with minimal rest between them
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="supersetName">Superset Name (Optional)</Label>
            <Input
              id="supersetName"
              value={supersetName}
              onChange={(e) => setSupersetName(e.target.value)}
              placeholder="e.g., Upper Body Superset"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Select Exercises (minimum 2)</Label>
            <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {availableExercises.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No exercises available for supersets
                </p>
              ) : (
                availableExercises.map(exercise => (
                  <div 
                    key={exercise.id} 
                    className={`
                      p-3 border rounded-md cursor-pointer transition-colors
                      ${selectedExercises.includes(exercise.id) 
                        ? 'border-primary bg-primary/10' 
                        : 'border-gray-200 hover:border-primary/50'}
                    `}
                    onClick={() => toggleExerciseSelection(exercise.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{exercise.exercise?.name || 'Exercise'}</div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {exercise.sets} sets × {exercise.reps} reps
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedExercises.length > 0 && (
            <div>
              <Label>Superset Order</Label>
              <div className="mt-2 space-y-2">
                {selectedExercises.map((exerciseId, index) => {
                  const exercise = exercises.find(ex => ex.id === exerciseId);
                  return (
                    <div key={exerciseId} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted h-6 w-6 rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <div className="font-medium">{exercise?.exercise?.name || 'Exercise'}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                        >
                          <MoveVertical className="h-4 w-4 rotate-180" />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === selectedExercises.length - 1}
                        >
                          <MoveVertical className="h-4 w-4" />
                          <span className="sr-only">Move down</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => setSelectedExercises(selectedExercises.filter(id => id !== exerciseId))}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isSubmitting}
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={isSubmitting || selectedExercises.length < 2}
            onClick={handleCreateSuperset}
          >
            {isSubmitting ? 'Creating...' : 'Create Superset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StandaloneSupersetManager;
