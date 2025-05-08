
import React from 'react';
import { useParams } from 'react-router-dom';
import { WorkoutHeader } from './WorkoutHeader';
import { WorkoutEditForm } from './WorkoutEditForm';
import { EditModeButtons, ViewModeButtons } from './ActionButtons';
import { ExercisesList } from './ExercisesList';
import { useWorkoutDetail } from './useWorkoutDetail';

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
    navigate
  } = useWorkoutDetail(workoutId);

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
      />
    </div>
  );
};

export default CustomWorkoutDetail;
