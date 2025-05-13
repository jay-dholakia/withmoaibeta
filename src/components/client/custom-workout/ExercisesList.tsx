
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { ExerciseDetail } from './ExerciseDetail';
import { CustomWorkoutExercise } from '@/services/clients/custom-workout/types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';

interface ExercisesListProps {
  exercises: CustomWorkoutExercise[];
  isReordering: boolean;
  isEditing: boolean;
  handleMoveExerciseUp: (exerciseId: string) => void;
  handleMoveExerciseDown: (exerciseId: string) => void;
  handleReorderExercises?: (result: DropResult) => void;
}

export const ExercisesList: React.FC<ExercisesListProps> = ({
  exercises,
  isReordering,
  isEditing,
  handleMoveExerciseUp,
  handleMoveExerciseDown,
  handleReorderExercises,
}) => {
  // Handle drag end event
  const onDragEnd = (result: DropResult) => {
    if (!handleReorderExercises) return;
    handleReorderExercises(result);
  };

  return (
    <div className="space-y-4">
      <Separator />
      
      <h2 className="text-xl font-semibold flex items-center gap-2">
        Exercises
        {isReordering && (
          <span className="text-sm text-muted-foreground font-normal">
            (Drag exercises to reorder)
          </span>
        )}
      </h2>
      
      {exercises.length === 0 ? (
        <p className="text-muted-foreground">No exercises found in this workout.</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="exercises-list">
            {(provided) => (
              <div 
                className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 pt-1 pb-2"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {exercises.map((exercise, index) => (
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
                        style={{
                          ...provided.draggableProps.style,
                          cursor: isReordering ? 'grab' : 'default'
                        }}
                        className={`transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        <ExerciseDetail
                          exercise={exercise}
                          index={index}
                          totalExercises={exercises.length}
                          isReordering={isReordering}
                          isEditing={isEditing}
                          handleMoveExerciseUp={handleMoveExerciseUp}
                          handleMoveExerciseDown={handleMoveExerciseDown}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};
