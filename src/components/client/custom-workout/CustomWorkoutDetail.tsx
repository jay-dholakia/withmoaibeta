
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { WorkoutHeader } from './WorkoutHeader';
import { WorkoutEditForm } from './WorkoutEditForm';
import { EditModeButtons, ViewModeButtons } from './ActionButtons';
import { ExercisesList } from './ExercisesList';
import { useWorkoutDetail } from './useWorkoutDetail';
import { DropResult } from 'react-beautiful-dnd';
import { reorderCustomWorkoutExercises } from '@/services/clients/custom-workout/reorder';
import { toast } from 'sonner';

const CustomWorkoutDetail: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const {
    workout,
    exercises,
    isLoading,
    isDeleting,
    isReordering,
    isEditing,
    isSaving,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editDuration,
    setEditDuration,
    editWorkoutType,
    setEditWorkoutType,
    handleDeleteWorkout,
    handleMoveExerciseUp,
    handleMoveExerciseDown,
    handleSaveWorkout,
    handleCancelEdit,
    setIsEditing,
    setExercises,
    navigate
  } = useWorkoutDetail(workoutId);

  const [isDragging, setIsDragging] = useState(false);

  // Handle drag-and-drop reordering
  const handleReorderExercises = async (dropResult: DropResult) => {
    // Drop outside the list or no movement
    if (!dropResult.destination || dropResult.source.index === dropResult.destination.index) {
      return;
    }

    if (!workoutId) return;

    try {
      const sourceIndex = dropResult.source.index;
      const destinationIndex = dropResult.destination.index;

      // Optimistically update UI first for better user experience
      const reorderedExercises = [...exercises];
      const [removed] = reorderedExercises.splice(sourceIndex, 1);
      reorderedExercises.splice(destinationIndex, 0, removed);
      
      // Update the order_index values
      const updatedExercises = reorderedExercises.map((exercise, index) => ({
        ...exercise,
        order_index: index
      }));
      
      setExercises(updatedExercises);

      // Now update in the database
      const reorderResult = await reorderCustomWorkoutExercises(
        workoutId, 
        updatedExercises.map(ex => ({ id: ex.id, order_index: ex.order_index }))
      );
      
      if (reorderResult) {
        // Optional: refresh from server to ensure sync
        setExercises(reorderResult);
      }
    } catch (error) {
      console.error('Error reordering exercises:', error);
      toast.error('Failed to reorder exercises');
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
        {isEditing ? (
          <>
            <div className="invisible">Placeholder</div> {/* For layout balance */}
            <div className="flex items-center gap-2">
              <EditModeButtons
                onCancel={handleCancelEdit}
                onSave={handleSaveWorkout}
                isSaving={isSaving}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <WorkoutHeader 
                workout={workout} 
                onBackClick={() => navigate('/client-dashboard/workouts')} 
              />
            </div>
            <div className="flex items-center gap-2">
              <ViewModeButtons
                onEdit={() => setIsEditing(true)}
                onDelete={handleDeleteWorkout}
                isDeleting={isDeleting}
              />
            </div>
          </>
        )}
      </div>

      {isEditing && (
        <WorkoutEditForm
          title={editTitle}
          setTitle={setEditTitle}
          description={editDescription}
          setDescription={setEditDescription}
          duration={editDuration}
          setDuration={setEditDuration}
          workoutType={editWorkoutType}
          setWorkoutType={setEditWorkoutType}
        />
      )}

      <ExercisesList
        exercises={exercises}
        isReordering={isReordering}
        isEditing={isEditing}
        handleMoveExerciseUp={handleMoveExerciseUp}
        handleMoveExerciseDown={handleMoveExerciseDown}
        handleReorderExercises={handleReorderExercises}
      />
    </div>
  );
};

export default CustomWorkoutDetail;
