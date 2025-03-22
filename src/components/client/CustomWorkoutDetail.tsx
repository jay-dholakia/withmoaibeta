
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, Clock, PlayCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  fetchCustomWorkout,
  fetchCustomWorkoutExercises,
  deleteCustomWorkout,
  CustomWorkout,
  CustomWorkoutExercise,
} from '@/services/client-custom-workout-service';

const CustomWorkoutDetail = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  
  const [workout, setWorkout] = useState<CustomWorkout | null>(null);
  const [exercises, setExercises] = useState<CustomWorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadWorkoutData = async () => {
      if (!workoutId) {
        navigate('/client-dashboard/workouts');
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch workout details
        const workoutData = await fetchCustomWorkout(workoutId);
        setWorkout(workoutData);
        
        // Fetch workout exercises
        const exercisesData = await fetchCustomWorkoutExercises(workoutId);
        setExercises(exercisesData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading workout:', error);
        toast.error('Failed to load workout details');
        navigate('/client-dashboard/workouts');
      }
    };

    loadWorkoutData();
  }, [workoutId, navigate]);

  const handleDelete = async () => {
    if (!workoutId || !workout) return;
    
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

  const startWorkout = () => {
    if (!workoutId) return;
    navigate(`/client-dashboard/workouts/custom/${workoutId}/active`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-client" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">Workout Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The workout you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate('/client-dashboard/workouts')}>
          Back to Workouts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/client-dashboard/workouts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{workout.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={startWorkout}
            className="bg-client hover:bg-client/90"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Start Workout
          </Button>
        </div>
      </div>

      {workout.description && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <p>{workout.description}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {workout.duration_minutes ? `${workout.duration_minutes} minutes` : 'Duration not specified'}
        </span>
      </div>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">Exercises</h2>
        
        {exercises.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No exercises added yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, index) => {
              const exerciseName = exercise.exercise?.name || exercise.custom_exercise_name || 'Unknown Exercise';
              
              return (
                <Card key={exercise.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{exerciseName}</CardTitle>
                        {exercise.exercise?.category && (
                          <CardDescription>{exercise.exercise.category}</CardDescription>
                        )}
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {exercise.sets && (
                        <div>
                          <p className="font-medium">Sets</p>
                          <p>{exercise.sets}</p>
                        </div>
                      )}
                      
                      {exercise.reps && (
                        <div>
                          <p className="font-medium">Reps</p>
                          <p>{exercise.reps}</p>
                        </div>
                      )}
                      
                      {exercise.rest_seconds && (
                        <div>
                          <p className="font-medium">Rest</p>
                          <p>{exercise.rest_seconds} sec</p>
                        </div>
                      )}
                    </div>
                    
                    {exercise.notes && (
                      <div className="mt-3 text-sm">
                        <p className="font-medium">Notes</p>
                        <p className="text-muted-foreground">{exercise.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomWorkoutDetail;
