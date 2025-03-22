
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  fetchCustomWorkouts,
  fetchCustomWorkoutExercises,
  deleteCustomWorkout,
  CustomWorkout,
  CustomWorkoutExercise
} from '@/services/client-custom-workout-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CustomWorkoutDetail = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<CustomWorkout | null>(null);
  const [exercises, setExercises] = useState<CustomWorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch workout details
        const workouts = await fetchCustomWorkouts();
        const currentWorkout = workouts.find(w => w.id === workoutId);
        
        if (!currentWorkout) {
          toast.error('Workout not found');
          navigate('/client-dashboard/workouts');
          return;
        }
        
        setWorkout(currentWorkout);
        
        // Fetch workout exercises
        const exercisesData = await fetchCustomWorkoutExercises(workoutId);
        setExercises(exercisesData);
      } catch (error) {
        console.error('Error loading workout details:', error);
        toast.error('Failed to load workout details');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkoutDetails();
  }, [workoutId, navigate]);

  const handleDeleteWorkout = async () => {
    if (!workoutId) return;
    
    try {
      setIsDeleting(true);
      await deleteCustomWorkout(workoutId);
      toast.success('Workout deleted successfully');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <p className="text-muted-foreground">Loading workout details...</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="py-12 flex justify-center">
        <p className="text-muted-foreground">Workout not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Workout'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the custom workout and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteWorkout}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">{workout.title}</h1>
        
        <div className="flex items-center text-muted-foreground mb-4">
          {workout.duration_minutes && (
            <div className="flex items-center mr-4">
              <Clock className="h-4 w-4 mr-1" />
              <span>{workout.duration_minutes} minutes</span>
            </div>
          )}
          <div>Created: {new Date(workout.created_at).toLocaleDateString()}</div>
        </div>
        
        {workout.description && (
          <p className="text-muted-foreground mb-6">{workout.description}</p>
        )}
      </div>

      <Separator />
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exercises</h2>
        
        {exercises.length === 0 ? (
          <p className="text-muted-foreground">No exercises found in this workout.</p>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, index) => (
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
                    
                    <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground font-medium">
                      {index + 1}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomWorkoutDetail;
