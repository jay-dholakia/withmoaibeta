
import React, { useState } from 'react';
import { WorkoutHistoryItem, PersonalRecord } from '@/types/workout';
import { toast } from 'sonner';
import { deleteWorkoutCompletion } from '@/services/workout-delete-service';
import { saveWorkoutJournalNotes, updateWorkoutCompletionDate } from '@/services/client-service';
import { updateWorkoutCompletion } from '@/services/workout-edit-service';
import { DateHeader } from './workout-day/DateHeader';
import { EmptyState } from './workout-day/EmptyState';
import { WorkoutCard } from './workout-day/WorkoutCard';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
  personalRecords: PersonalRecord[];
}

export const WorkoutDayDetails: React.FC<WorkoutDayDetailsProps> = ({ 
  date, 
  workouts,
  personalRecords 
}) => {
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const [isUpdatingDate, setIsUpdatingDate] = useState<{ [key: string]: boolean }>({});
  const [editExerciseStates, setEditExerciseStates] = useState<{
    [workoutId: string]: {
      [exerciseId: string]: {
        sets: Array<{
          setNumber: number;
          weight: string;
          reps: string;
          completed: boolean;
        }>;
      }
    }
  }>({});

  // Initialize exercise states for a workout if they don't exist
  const initializeExerciseState = (workout: WorkoutHistoryItem) => {
    if (!workout.workout?.workout_exercises) return;
    
    const workoutId = workout.id;
    
    if (!editExerciseStates[workoutId]) {
      const initialState: typeof editExerciseStates = { 
        [workoutId]: {} 
      };
      
      workout.workout.workout_exercises.forEach(exercise => {
        initialState[workoutId][exercise.id] = {
          sets: Array.from({ length: exercise.sets }, (_, i) => ({
            setNumber: i + 1,
            weight: '',
            reps: exercise.reps || '',
            completed: false
          }))
        };
      });
      
      setEditExerciseStates(prev => ({
        ...prev,
        ...initialState
      }));
    }
  };

  // Function to handle workout deletion
  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      setIsDeleting(prev => ({ ...prev, [workoutId]: true }));
      
      const success = await deleteWorkoutCompletion(workoutId);
      
      if (success) {
        toast.success("Workout deleted successfully");
        // Remove the workout from the local state to update the UI immediately
        // You'll need to implement a way to update the parent component's state here
        // For now, we can just reload the page after a short delay
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("Failed to delete workout");
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("An error occurred while deleting the workout");
    } finally {
      setIsDeleting(prev => ({ ...prev, [workoutId]: false }));
    }
  };

  // Function to update workout date
  const handleUpdateWorkoutDate = async (workoutId: string, newDate: Date) => {
    try {
      setIsUpdatingDate(prev => ({ ...prev, [workoutId]: true }));
      
      // Format date for database
      const formattedDate = newDate.toISOString();
      
      // Call the API to update the workout date
      const success = await updateWorkoutCompletion(workoutId, {
        completed_at: formattedDate
      });
      
      if (success) {
        toast.success("Workout date updated successfully");
        // Reload to show updated data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("Failed to update workout date");
      }
    } catch (error) {
      console.error("Error updating workout date:", error);
      toast.error("An error occurred while updating the workout date");
    } finally {
      setIsUpdatingDate(prev => ({ ...prev, [workoutId]: false }));
    }
  };

  // Function to handle exercise set changes
  const handleSetChange = (workoutId: string, exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setEditExerciseStates(prev => {
      const workoutState = prev[workoutId] || {};
      const exerciseState = workoutState[exerciseId] || { 
        sets: [] 
      };
      
      const updatedSets = [...exerciseState.sets];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value
      };
      
      return {
        ...prev,
        [workoutId]: {
          ...workoutState,
          [exerciseId]: {
            ...exerciseState,
            sets: updatedSets
          }
        }
      };
    });
  };

  // Function to handle exercise set completion
  const handleSetCompletion = (workoutId: string, exerciseId: string, setIndex: number, completed: boolean) => {
    setEditExerciseStates(prev => {
      const workoutState = prev[workoutId] || {};
      const exerciseState = workoutState[exerciseId] || { 
        sets: [] 
      };
      
      const updatedSets = [...exerciseState.sets];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        completed: Boolean(completed)
      };
      
      return {
        ...prev,
        [workoutId]: {
          ...workoutState,
          [exerciseId]: {
            ...exerciseState,
            sets: updatedSets
          }
        }
      };
    });
  };

  if (!workouts || workouts.length === 0) {
    return <EmptyState date={date} />;
  }

  // Sort workouts by completion time, most recent first
  const sortedWorkouts = [...workouts].sort((a, b) => {
    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
  });

  return (
    <div className="space-y-6">
      <DateHeader date={date} />
      
      {sortedWorkouts.map((workout) => (
        <WorkoutCard 
          key={workout.id}
          workout={workout}
          personalRecords={personalRecords}
          exerciseStates={editExerciseStates}
          isDeleting={isDeleting}
          isUpdatingDate={isUpdatingDate}
          onDeleteWorkout={handleDeleteWorkout}
          onUpdateWorkoutDate={handleUpdateWorkoutDate}
          onSetChange={handleSetChange}
          onSetCompletion={handleSetCompletion}
          initializeExerciseState={initializeExerciseState}
        />
      ))}
    </div>
  );
};
