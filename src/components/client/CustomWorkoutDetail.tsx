
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import { Clock, CalendarDays, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CustomWorkout } from '@/services/client-custom-workout-service';
import { deleteCustomWorkout } from '@/services/client-custom-workout-service';

interface CustomWorkoutDetailProps {
  workout: CustomWorkout;
  onDelete?: () => void;
  onStart?: () => void;
}

export const CustomWorkoutDetail: React.FC<CustomWorkoutDetailProps> = ({ workout, onDelete, onStart }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCustomWorkout(workout.id);
      toast.success('Workout deleted successfully');
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleStartWorkout = async () => {
    try {
      setStartingWorkout(true);
      
      // Since startCustomWorkout doesn't exist yet, let's create a simple placeholder
      // In a real implementation, this would call an actual API
      const result = {
        success: true,
        session_id: workout.id
      };
      
      if (result.success) {
        toast.success('Workout started!');
        navigate(`/client-dashboard/workout-session/${result.session_id}`);
      } else {
        toast.error('Failed to start workout');
      }
      
      if (onStart) onStart();
    } catch (error) {
      console.error('Error starting workout:', error);
      toast.error('Failed to start workout');
    } finally {
      setStartingWorkout(false);
    }
  };

  return (
    <Card className="overflow-hidden border">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <WorkoutTypeIcon type={workout.workout_type || 'strength'} />
          <CardTitle className="text-lg font-medium">{workout.title}</CardTitle>
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => navigate(`/client-dashboard/custom-workout/${workout.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-destructive" 
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {workout.description && (
          <p className="text-sm text-muted-foreground mb-2">{workout.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="bg-muted text-xs rounded-full px-2 py-1 flex items-center">
            <CalendarDays className="w-3 h-3 mr-1" />
            {new Date(workout.created_at).toLocaleDateString()}
          </div>
          {workout.duration_minutes && (
            <div className="bg-muted text-xs rounded-full px-2 py-1 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {workout.duration_minutes} min
            </div>
          )}
        </div>
        
        <Separator className="my-2" />
        
        <div className="mt-3">
          <h4 className="text-sm font-medium mb-2">Exercises:</h4>
          <ul className="text-sm space-y-1">
            {workout.workout_exercises?.map((exercise, idx) => (
              <li key={idx} className="flex items-center text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-2 text-xs">
                  {idx + 1}
                </div>
                <span>{exercise.exercise?.name || exercise.custom_exercise_name || 'Exercise'}</span>
                <span className="ml-auto text-xs">
                  {exercise.sets} × {exercise.reps}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              className="w-full mt-2 gap-2" 
              disabled={startingWorkout}
              onClick={handleStartWorkout}
            >
              <CheckCircle2 className="h-4 w-4" />
              {startingWorkout ? 'Starting...' : 'Start Workout'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Workout</DialogTitle>
              <DialogDescription>
                Are you ready to begin this workout? Your progress will be tracked.
              </DialogDescription>
            </DialogHeader>
            {/* Dialog content here */}
          </DialogContent>
        </Dialog>
      </CardFooter>
      
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Workout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this custom workout? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
