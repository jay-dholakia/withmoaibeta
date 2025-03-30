
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, Trash2, MoveVertical, X } from "lucide-react";
import { 
  updateSupersetGroup, 
  deleteSupersetGroup,
  removeExerciseFromSupersetGroup,
  updateExerciseSupersetOrder
} from '@/services/workout-service';
import { WorkoutExercise, SupersetGroup as SupersetGroupType } from '@/types/workout';
import { toast } from "sonner";

interface SupersetGroupProps {
  supersetGroup: SupersetGroupType;
  workoutExercises: WorkoutExercise[];
  onUpdate: () => void;
  onDelete: () => void;
}

const SupersetGroup: React.FC<SupersetGroupProps> = ({
  supersetGroup,
  workoutExercises,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(supersetGroup.title || 'Superset');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter exercises that belong to this superset group
  const supersetExercises = workoutExercises
    .filter(ex => ex.superset_group_id === supersetGroup.id)
    .sort((a, b) => (a.superset_order || 0) - (b.superset_order || 0));

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);
      await updateSupersetGroup(supersetGroup.id, { title });
      setIsEditing(false);
      onUpdate();
      toast.success('Superset updated');
    } catch (error) {
      console.error('Error updating superset:', error);
      toast.error('Failed to update superset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this superset? Exercises will be kept but no longer grouped.')) {
      try {
        setIsSubmitting(true);
        await deleteSupersetGroup(supersetGroup.id);
        onDelete();
        toast.success('Superset deleted');
      } catch (error) {
        console.error('Error deleting superset:', error);
        toast.error('Failed to delete superset');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      await removeExerciseFromSupersetGroup(exerciseId);
      onUpdate();
      toast.success('Exercise removed from superset');
    } catch (error) {
      console.error('Error removing exercise from superset:', error);
      toast.error('Failed to remove exercise from superset');
    }
  };

  const handleMoveExercise = async (exerciseId: string, direction: 'up' | 'down') => {
    const exerciseIndex = supersetExercises.findIndex(ex => ex.id === exerciseId);
    
    if (exerciseIndex === -1) return;
    if (direction === 'up' && exerciseIndex === 0) return;
    if (direction === 'down' && exerciseIndex === supersetExercises.length - 1) return;
    
    const targetIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    const targetExercise = supersetExercises[targetIndex];
    const currentExercise = supersetExercises[exerciseIndex];
    
    try {
      // Swap the order of the two exercises
      await updateExerciseSupersetOrder(currentExercise.id, targetExercise.superset_order || 0);
      await updateExerciseSupersetOrder(targetExercise.id, currentExercise.superset_order || 0);
      onUpdate();
    } catch (error) {
      console.error('Error reordering exercises:', error);
      toast.error('Failed to reorder exercises');
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5 mb-6">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-grow">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Superset name"
                className="h-8"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4" />
                <span className="sr-only">Save</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel</span>
              </Button>
            </div>
          ) : (
            <>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {title || 'Superset'}
                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
                  {supersetExercises.length} exercises
                </span>
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  disabled={isSubmitting}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="space-y-2">
          {supersetExercises.map((exercise, index) => (
            <div 
              key={exercise.id} 
              className="flex items-center justify-between p-2 bg-background rounded-md border"
            >
              <div className="flex items-center gap-2">
                <div className="bg-muted h-6 w-6 rounded-full flex items-center justify-center text-sm">
                  {index + 1}
                </div>
                <div className="font-medium">{exercise.exercise?.name || 'Exercise'}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => handleMoveExercise(exercise.id, 'up')}
                  disabled={index === 0}
                >
                  <MoveVertical className="h-4 w-4 rotate-180" />
                  <span className="sr-only">Move up</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => handleMoveExercise(exercise.id, 'down')}
                  disabled={index === supersetExercises.length - 1}
                >
                  <MoveVertical className="h-4 w-4" />
                  <span className="sr-only">Move down</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => handleRemoveExercise(exercise.id)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupersetGroup;
