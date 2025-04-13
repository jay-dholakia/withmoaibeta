
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { fetchWorkout, fetchWorkoutExercises } from '@/services/workout-service';
import { toast } from 'sonner';

const WorkoutExercisesPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutId) return;

      try {
        setIsLoading(true);
        console.log("Fetching workout data for ID:", workoutId);
        
        const workoutData = await fetchWorkout(workoutId);
        
        if (workoutData) {
          console.log("Workout data received:", workoutData);
          setWorkout(workoutData);
          
          // Also fetch any exercises for this workout
          const exercisesData = await fetchWorkoutExercises(workoutId);
          console.log("Exercises data received:", exercisesData);
          setExercises(exercisesData || []);
        } else {
          toast.error('Workout not found');
          navigate(-1);
        }
      } catch (error) {
        console.error('Error loading workout details:', error);
        toast.error('Failed to load workout details');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkoutDetails();
  }, [workoutId, navigate]);

  const handleBackClick = () => {
    navigate(`/workouts/${workoutId}/edit`);
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1" 
          onClick={handleBackClick}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Workout
        </Button>

        <h1 className="text-2xl font-bold mb-6">
          Manage Exercises for {workout?.title || 'Workout'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            {exercises.length > 0 ? (
              <div className="space-y-4">
                {exercises.map((exercise: any) => (
                  <div key={exercise.id} className="p-4 border rounded-md">
                    <h3 className="font-medium">{exercise.exercise?.name || 'Exercise'}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.rest_seconds ? ` (${exercise.rest_seconds}s rest)` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No exercises added yet</p>
                <p className="mt-2">Add exercises to build out this workout</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default WorkoutExercisesPage;
