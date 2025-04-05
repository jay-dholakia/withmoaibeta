
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkoutHistoryItem, WorkoutSetCompletion } from '@/types/workout';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { batchUpdateWorkoutSetCompletions } from '@/services/workout-edit-service';

interface ExerciseGroup {
  name: string;
  type: string;
  sets: WorkoutSetCompletion[];
}

interface EditWorkoutSetCompletionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutHistoryItem;
  exerciseGroups: Record<string, ExerciseGroup>;
  onSave: () => void;
}

const EditWorkoutSetCompletions: React.FC<EditWorkoutSetCompletionsProps> = ({
  open,
  onOpenChange,
  workout,
  exerciseGroups,
  onSave
}) => {
  const [editedSets, setEditedSets] = useState<Record<string, WorkoutSetCompletion>>({});
  const [saving, setSaving] = useState(false);

  // Initialize edited sets from workout data
  React.useEffect(() => {
    if (open && workout.workout_set_completions) {
      const initialEdits: Record<string, WorkoutSetCompletion> = {};
      workout.workout_set_completions.forEach(set => {
        initialEdits[set.id] = { ...set };
      });
      setEditedSets(initialEdits);
    }
  }, [open, workout]);

  // Handle form input changes
  const handleSetChange = (setId: string, field: keyof WorkoutSetCompletion, value: any) => {
    setEditedSets(prev => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [field]: value
      }
    }));
  };

  // Save changes to the database
  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare updates for all modified sets
      const updates = Object.entries(editedSets).map(([id, set]) => ({
        id,
        changes: {
          reps_completed: set.reps_completed,
          weight: set.weight,
          duration: set.duration,
          notes: set.notes
        }
      }));
      
      // Use our batch update service
      const successCount = await batchUpdateWorkoutSetCompletions(updates);
      
      if (successCount === 0) {
        toast.error("Failed to update workout data");
      } else if (successCount < updates.length) {
        toast.warning(`Updated ${successCount} of ${updates.length} sets`);
      } else {
        toast.success("Workout data updated successfully");
      }
      
      setSaving(false);
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving workout changes:", error);
      toast.error("Failed to update workout data");
      setSaving(false);
    }
  };

  if (!workout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit Workout: {workout.workout?.title || "Completed Workout"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {Object.entries(exerciseGroups).map(([exerciseId, group]) => (
            <div key={exerciseId} className="border rounded-md p-3">
              <h3 className="font-medium mb-2">{group.name}</h3>
              
              {group.type === 'cardio' ? (
                // Duration only for cardio exercises
                <div className="mb-3">
                  <label className="text-sm font-medium block mb-1">Duration</label>
                  <Input 
                    value={editedSets[group.sets[0]?.id]?.duration || ''}
                    onChange={(e) => handleSetChange(
                      group.sets[0]?.id, 
                      'duration', 
                      e.target.value
                    )}
                    placeholder="hh:mm:ss"
                    className="w-full"
                  />
                </div>
              ) : (
                // Sets, reps, weight for strength exercises
                <div className="space-y-3">
                  {group.sets.sort((a, b) => a.set_number - b.set_number).map(set => (
                    <div key={set.id} className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Set {set.set_number}</label>
                      </div>
                      <div className="px-1">
                        <Input
                          type="number"
                          value={editedSets[set.id]?.reps_completed || 0}
                          onChange={(e) => handleSetChange(
                            set.id, 
                            'reps_completed', 
                            parseInt(e.target.value) || 0
                          )}
                          placeholder="Reps"
                          className="w-full h-8 text-sm px-2"
                        />
                      </div>
                      <div className="px-1">
                        <Input
                          type="number"
                          value={editedSets[set.id]?.weight || 0}
                          onChange={(e) => handleSetChange(
                            set.id, 
                            'weight', 
                            parseFloat(e.target.value) || 0
                          )}
                          placeholder="Weight"
                          className="w-full h-8 text-sm px-2"
                          step="0.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Notes for all exercise types */}
              <div className="mt-2">
                <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                <Input
                  value={editedSets[group.sets[0]?.id]?.notes || ''}
                  onChange={(e) => {
                    // Apply notes to all sets of this exercise
                    group.sets.forEach(set => {
                      handleSetChange(set.id, 'notes', e.target.value);
                    });
                  }}
                  placeholder="Exercise notes"
                  className="w-full text-sm"
                />
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditWorkoutSetCompletions;
