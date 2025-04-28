
import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CopyWorkoutWeekDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceWeekId: string;
  sourceWeekNumber: number;
  allWeeks: any[];
  onCopyComplete: () => void;
}

export const CopyWorkoutWeekDialog: React.FC<CopyWorkoutWeekDialogProps> = ({
  isOpen,
  onClose,
  sourceWeekId,
  sourceWeekNumber,
  allWeeks,
  onCopyComplete,
}) => {
  const [targetWeekId, setTargetWeekId] = useState<string>("");
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const { user } = useAuth();

  const handleWeekSelect = async (weekId: string) => {
    const { data: existingWorkouts } = await supabase
      .from('workouts')
      .select('id')
      .eq('week_id', weekId);

    if (existingWorkouts && existingWorkouts.length > 0) {
      setTargetWeekId(weekId);
      setShowOverwriteWarning(true);
    } else {
      setTargetWeekId(weekId);
      handleCopyConfirm(weekId);
    }
  };

  const handleCopyConfirm = async (weekIdToCopy: string = targetWeekId) => {
    if (!weekIdToCopy || !sourceWeekId) return;
    
    setIsCopying(true);
    try {
      // Fetch source workouts
      const { data: sourceWorkouts, error: sourceError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (*)
        `)
        .eq('week_id', sourceWeekId);

      if (sourceError) throw new Error("Failed to fetch source workouts");
      if (!sourceWorkouts) throw new Error("No workouts found to copy");

      // Delete existing workouts in target week if any
      await supabase
        .from('workouts')
        .delete()
        .eq('week_id', weekIdToCopy);

      // Copy each workout and its exercises
      for (const workout of sourceWorkouts) {
        // Create new workout
        const { data: newWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            week_id: weekIdToCopy,
            title: workout.title,
            description: workout.description,
            day_of_week: workout.day_of_week,
            workout_type: workout.workout_type,
            priority: workout.priority
          })
          .select()
          .single();

        if (workoutError || !newWorkout) throw new Error("Failed to create workout copy");

        // Copy exercises if any
        if (workout.workout_exercises && workout.workout_exercises.length > 0) {
          const exerciseCopies = workout.workout_exercises.map((ex: any) => ({
            workout_id: newWorkout.id,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
            order_index: ex.order_index,
            superset_order: ex.superset_order,
            superset_group_id: ex.superset_group_id
          }));

          const { error: exerciseError } = await supabase
            .from('workout_exercises')
            .insert(exerciseCopies);

          if (exerciseError) throw new Error("Failed to copy workout exercises");
        }
      }

      const targetWeek = allWeeks.find(w => w.id === weekIdToCopy);
      toast.success(`Workouts copied from Week ${sourceWeekNumber} to Week ${targetWeek?.week_number}`);
      onCopyComplete();
      onClose();
      setShowOverwriteWarning(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to copy workouts");
    } finally {
      setIsCopying(false);
    }
  };

  // Filter out the source week from target options
  const targetWeekOptions = allWeeks.filter(week => week.id !== sourceWeekId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy workouts from Week {sourceWeekNumber} to...</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Select onValueChange={handleWeekSelect} value={targetWeekId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target week" />
              </SelectTrigger>
              <SelectContent>
                {targetWeekOptions.map((week) => (
                  <SelectItem key={week.id} value={week.id}>
                    Week {week.week_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isCopying}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showOverwriteWarning} onOpenChange={setShowOverwriteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirm Overwrite
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite existing workouts in Week {targetWeekOptions.find(w => w.id === targetWeekId)?.week_number}. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowOverwriteWarning(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleCopyConfirm()}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
