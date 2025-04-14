
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchStandaloneWorkout } from '@/services/workout-service';
import StandaloneWorkoutForm from '@/components/coach/StandaloneWorkoutForm';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const StandaloneWorkoutDetailsPage: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workout, setWorkout] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadWorkout = async () => {
      if (!workoutId) {
        setError("No workout ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchStandaloneWorkout(workoutId);
        setWorkout(data);
      } catch (err) {
        console.error('Error loading workout:', err);
        setError("Failed to load workout details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkout();
  }, [workoutId]);

  const handleBack = () => {
    navigate('/coach-dashboard/workout-templates');
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    loadWorkout();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = (savedWorkoutId: string) => {
    setIsEditing(false);
    toast.success("Workout template updated successfully");
    // Reload the workout to get the latest data
    loadWorkout();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const loadWorkout = async () => {
    if (!workoutId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchStandaloneWorkout(workoutId);
      setWorkout(data);
    } catch (err) {
      console.error('Error loading workout:', err);
      setError("Failed to load workout details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CoachLayout>
      <div className="container mx-auto py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Templates
        </Button>

        <h1 className="text-2xl font-bold mb-6">Workout Template Details</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Loading workout details...</span>
          </div>
        ) : error ? (
          <Card className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRetry}>
              Try Again
            </Button>
          </Card>
        ) : workout ? (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{workout.title}</h2>
                  {workout.category && (
                    <p className="text-muted-foreground mt-1">Category: {workout.category}</p>
                  )}
                </div>
                <Button onClick={handleEdit}>
                  Edit Template
                </Button>
              </div>
              
              {workout.description && (
                <div className="mt-4">
                  <h3 className="font-medium">Description</h3>
                  <p className="mt-1">{workout.description}</p>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="font-medium">Type</h3>
                <p className="mt-1 capitalize">{workout.workout_type}</p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium">Exercises</h3>
                {workout.workout_exercises && workout.workout_exercises.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    {workout.workout_exercises.map((exercise: any, index: number) => (
                      <div key={exercise.id} className="border p-3 rounded-md">
                        <div className="font-medium">{index + 1}. {exercise.exercise?.name || 'Exercise'}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.rest_seconds ? ` (${exercise.rest_seconds}s rest)` : ''}
                        </div>
                        {exercise.notes && (
                          <div className="text-sm mt-1">{exercise.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2">No exercises added to this template</p>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Workout template not found</p>
            <Button onClick={handleBack} className="mt-4">
              Back to Templates
            </Button>
          </Card>
        )}
        
        <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Workout Template</DialogTitle>
            </DialogHeader>
            {workoutId && (
              <StandaloneWorkoutForm
                workoutId={workoutId}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
                mode="edit"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CoachLayout>
  );
};

export default StandaloneWorkoutDetailsPage;
