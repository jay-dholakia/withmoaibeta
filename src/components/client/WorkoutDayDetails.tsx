
import React, { useState } from 'react';
import { format } from 'date-fns';
import { WorkoutHistoryItem, WorkoutExercise, PersonalRecord } from '@/types/workout';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { StrengthExercise } from '@/components/client/workout/StrengthExercise';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, BookText, AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { deleteWorkoutCompletion } from '@/services/workout-delete-service';
import { saveWorkoutJournalNotes } from '@/services/client-service';
import { toast } from 'sonner';

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
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [journalNotes, setJournalNotes] = useState<{ [key: string]: string }>({});
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
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

  const toggleWorkoutExpanded = (workoutId: string) => {
    setExpandedWorkoutId(expandedWorkoutId === workoutId ? null : workoutId);
  };

  // Function to handle journal note changes
  const handleJournalChange = (workoutId: string, value: string) => {
    setJournalNotes({
      ...journalNotes,
      [workoutId]: value
    });
  };

  // Function to save journal notes
  const handleSaveJournal = async (workout: WorkoutHistoryItem) => {
    if (!workout.id) {
      toast.error("Could not save journal notes: Missing workout ID");
      return;
    }

    try {
      const success = await saveWorkoutJournalNotes(
        workout.id,
        journalNotes[workout.id] || ''
      );
      
      if (success) {
        toast.success("Journal notes saved");
      } else {
        toast.error("Failed to save journal notes");
      }
    } catch (error) {
      console.error("Error saving journal notes:", error);
      toast.error("An error occurred while saving journal notes");
    }
  };

  // Function to find a personal record for a specific exercise
  const findPersonalRecord = (exerciseId: string): PersonalRecord | undefined => {
    if (!personalRecords || personalRecords.length === 0) return undefined;
    
    // Debug logging to understand what's happening
    console.log(`Looking for PR for exercise: ${exerciseId}`);
    console.log(`Available PRs:`, personalRecords);
    
    const record = personalRecords.find(pr => pr.exercise_id === exerciseId);
    if (record) {
      console.log(`Found PR:`, record);
    } else {
      console.log(`No PR found for exercise: ${exerciseId}`);
    }
    
    return record;
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
        completed
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
        const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
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

  // Initialize journal notes from workout data on component load
  React.useEffect(() => {
    const notesMap: { [key: string]: string } = {};
    workouts.forEach(workout => {
      if (workout.notes) {
        notesMap[workout.id] = workout.notes;
      }
    });
    setJournalNotes(notesMap);
  }, [workouts]);

  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No workout history found for {format(date, 'MMMM d, yyyy')}</p>
      </div>
    );
  }

  // Sort workouts by completion time, most recent first
  const sortedWorkouts = [...workouts].sort((a, b) => {
    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">{format(date, 'MMMM d, yyyy')}</h3>
      
      {sortedWorkouts.map((workout) => {
        // Initialize exercise states when rendering a workout
        initializeExerciseState(workout);
        
        return (
          <Card key={workout.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium">
                  {workout.title || workout.workout?.title || 'Workout'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {workout.workout_type && (
                    <Badge variant="outline">{workout.workout_type}</Badge>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting[workout.id]}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete workout</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this workout? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-0">
              {workout.description && (
                <p className="text-sm text-muted-foreground mb-4">{workout.description}</p>
              )}
              
              {/* Workout type-specific content */}
              {workout.life_happens_pass && (
                <div className="bg-muted p-3 rounded text-sm">Life Happens Pass Used</div>
              )}
              
              {workout.rest_day && (
                <div className="bg-muted p-3 rounded text-sm">Rest Day</div>
              )}
              
              {/* Display exercises if they exist */}
              {workout.workout?.workout_exercises && workout.workout.workout_exercises.length > 0 && (
                <div className="mt-4 space-y-4">
                  <h4 className="text-sm font-medium">Exercises</h4>
                  
                  {workout.workout.workout_exercises.map((exercise) => (
                    <div key={exercise.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          <h5 className="font-medium">{exercise.exercise?.name || 'Exercise'}</h5>
                          {exercise.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>
                          )}
                          
                          {/* Find and pass the personal record for this exercise */}
                          {exercise.exercise && exercise.exercise.id && (
                            <div className="mt-2">
                              <StrengthExercise 
                                exercise={exercise} 
                                exerciseState={
                                  editExerciseStates[workout.id]?.[exercise.id] || {
                                    sets: Array.from({ length: exercise.sets }, (_, i) => ({
                                      setNumber: i + 1,
                                      weight: '',
                                      reps: exercise.reps || '',
                                      completed: false
                                    }))
                                  }
                                }
                                personalRecord={findPersonalRecord(exercise.exercise.id)}
                                onSetChange={(setIndex, field, value) => 
                                  handleSetChange(workout.id, exercise.id, Number(setIndex), field, value)
                                }
                                onSetCompletion={(setIndex, completed) => 
                                  handleSetCompletion(workout.id, exercise.id, Number(setIndex), completed)
                                }
                                onVideoClick={() => {}}
                                onSwapClick={() => {}}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Journal Notes Section */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <BookText className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Workout Journal</h4>
                </div>
                <Textarea
                  placeholder="Add notes about your workout here..."
                  value={journalNotes[workout.id] || ''}
                  onChange={(e) => handleJournalChange(workout.id, e.target.value)}
                  className="min-h-24"
                />
                <Button 
                  size="sm" 
                  onClick={() => handleSaveJournal(workout)}
                >
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
