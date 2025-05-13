import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft, Plus, Video, ListReorder } from 'lucide-react';
import { 
  fetchWorkout, 
  fetchWorkoutExercises,
  createWorkoutExercise,
  deleteWorkoutExercise,
  moveWorkoutExerciseUp,
  moveWorkoutExerciseDown
} from '@/services/workout-service';
import { toast } from 'sonner';
import { ExerciseSelector } from '@/components/coach/ExerciseSelector';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { VideoDialog } from '@/components/client/workout/VideoDialog';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';

const WorkoutExercisesPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  const [isReordering, setIsReordering] = useState(false);

  // Use useEffect with an empty dependency array to track initial page load
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutId || !user) return;

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

    if (pageLoaded && user) {
      loadWorkoutDetails();
    }
  }, [workoutId, navigate, user, pageLoaded]);

  // Handle drag end to reorder exercises
  const handleReorderExercises = async (result: DropResult) => {
    if (!result.destination || !workoutId) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    try {
      setIsSubmitting(true);
      
      // Optimistically update UI
      const reorderedExercises = [...exercises];
      const [removed] = reorderedExercises.splice(sourceIndex, 1);
      reorderedExercises.splice(destinationIndex, 0, removed);
      
      // Update order_index values
      const updatedExercises = reorderedExercises.map((exercise, index) => ({
        ...exercise,
        order_index: index
      }));
      
      setExercises(updatedExercises);
      
      // Update in database
      // We need to create a reorderWorkoutExercises function
      const exerciseOrder = updatedExercises.map((exercise, index) => ({
        id: exercise.id,
        order_index: index
      }));
      
      // Import and call the reorder function
      const { reorderWorkoutExercises } = await import('@/services/workout/reorder');
      await reorderWorkoutExercises(workoutId, exerciseOrder);
      
      toast.success('Exercises reordered successfully');
    } catch (error) {
      console.error('Error reordering exercises:', error);
      toast.error('Failed to reorder exercises');
      
      // Refresh original exercise order on error
      const refreshedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(refreshedExercises || []);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    navigate(`/workouts/${workoutId}/edit`);
  };

  const handleSaveExercise = async (exerciseId: string, data: any) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await createWorkoutExercise({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sets: data.sets || 3,
        reps: data.reps || "8-12",
        rest_seconds: data.rest_seconds || 60,
        notes: data.notes || "",
        order_index: exercises.length
      });
      
      // Refresh the exercises list
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      setIsAddingExercise(false);
      toast.success('Exercise added successfully');
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast.error('Failed to add exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await deleteWorkoutExercise(exerciseId);
      
      // Refresh the exercises list
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      toast.success('Exercise removed from workout');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Failed to remove exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveExerciseUp = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      console.log("Moving exercise up:", exerciseId);
      
      const result = await moveWorkoutExerciseUp(exerciseId, workoutId);
      console.log("Move up result:", result);
      
      // Refresh the exercises list
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      toast.success('Exercise moved up');
    } catch (error) {
      console.error('Error moving exercise up:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveExerciseDown = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      console.log("Moving exercise down:", exerciseId);
      
      const result = await moveWorkoutExerciseDown(exerciseId, workoutId);
      console.log("Move down result:", result);
      
      // Refresh the exercises list
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      toast.success('Exercise moved down');
    } catch (error) {
      console.error('Error moving exercise down:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenVideoDialog = (exercise: any) => {
    if (exercise?.exercise?.youtube_link) {
      setSelectedVideoUrl(exercise.exercise.youtube_link);
      setSelectedExerciseName(exercise.exercise?.name || 'Exercise');
      setVideoDialogOpen(true);
    } else {
      toast.info('No video available for this exercise');
    }
  };

  // Toggle reordering mode
  const toggleReorderingMode = () => {
    setIsReordering(!isReordering);
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exercises</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={toggleReorderingMode} 
                size="sm"
                variant={isReordering ? "secondary" : "outline"}
                className="gap-1"
              >
                <ListReorder className="h-4 w-4" />
                {isReordering ? "Done Reordering" : "Reorder"}
              </Button>
              <Button 
                onClick={() => setIsAddingExercise(true)}
                size="sm"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Exercise
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {exercises.length > 0 ? (
              <DragDropContext onDragEnd={handleReorderExercises}>
                <Droppable droppableId="exercises-list">
                  {(provided) => (
                    <div 
                      className="space-y-4"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {exercises.map((exercise: any, index: number) => (
                        <Draggable 
                          key={exercise.id} 
                          draggableId={exercise.id} 
                          index={index}
                          isDragDisabled={!isReordering}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border p-4 rounded-md shadow-sm transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex">
                                  {isReordering && (
                                    <div 
                                      className="mr-3 self-center cursor-grab"
                                      {...provided.dragHandleProps}
                                    >
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-medium">{index + 1}. {exercise.exercise?.name || 'Exercise'}</h3>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {exercise.sets} sets × {exercise.reps} reps
                                      {exercise.rest_seconds ? ` (${exercise.rest_seconds}s rest)` : ''}
                                    </div>
                                    {exercise.notes && (
                                      <div className="text-sm mt-2 border-l-2 pl-2 border-muted">{exercise.notes}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleMoveExerciseUp(exercise.id)}
                                    disabled={index === 0 || isSubmitting || isReordering}
                                  >
                                    Move Up
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleMoveExerciseDown(exercise.id)}
                                    disabled={index === exercises.length - 1 || isSubmitting || isReordering}
                                  >
                                    Move Down
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenVideoDialog(exercise)}
                                    disabled={!exercise?.exercise?.youtube_link}
                                  >
                                    <Video className="h-4 w-4 mr-2" />
                                    Video
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleDeleteExercise(exercise.id)}
                                    disabled={isSubmitting || isReordering}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No exercises added yet</p>
                <p className="mt-2">Click the "Add Exercise" button to start building your workout</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddingExercise} onOpenChange={(open) => !open && setIsAddingExercise(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Exercise to Workout</DialogTitle>
            <DialogDescription>
              Select an exercise to add to this workout
            </DialogDescription>
          </DialogHeader>
          <ExerciseSelector
            onSelectExercise={() => {}} // We're using the legacy onSelect flow
            onSelect={handleSaveExercise}
            onCancel={() => setIsAddingExercise(false)}
            isSubmitting={isSubmitting}
            buttonText="Add Exercise"
          />
        </DialogContent>
      </Dialog>

      <VideoDialog 
        isOpen={videoDialogOpen} 
        onClose={() => setVideoDialogOpen(false)}
        videoUrl={selectedVideoUrl}
        exerciseName={selectedExerciseName}
      />
    </CoachLayout>
  );
};

export default WorkoutExercisesPage;
