
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { Umbrella } from 'lucide-react';
import { WorkoutTypeIcon } from '@/components/client/WorkoutTypeIcon';
import { fetchWorkoutExercises } from '@/services/client-workout-history-service';
import { formatInTimeZone } from 'date-fns-tz';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutJournalSection } from './WorkoutJournalSection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
}

export const WorkoutDayDetails: React.FC<WorkoutDayDetailsProps> = ({ date, workouts }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistoryItem | null>(null);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const [exercises, setExercises] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user } = useAuth();

  // Convert date to string in yyyy-MM-dd format
  const dateString = formatInTimeZone(date, 'UTC', 'yyyy-MM-dd');
  
  // Filter workouts by the current date
  const workoutsOnDate = workouts.filter(workout => {
    if (!workout.completed_at) return false;
    const completedDate = new Date(workout.completed_at);
    const workoutDateString = formatInTimeZone(completedDate, 'UTC', 'yyyy-MM-dd');
    const matches = workoutDateString === dateString;
    console.log(`Selected date: ${dateString}, workout date: ${workoutDateString}, match: ${matches}`);
    return matches;
  });
  
  console.log(`Selected date: ${dateString}, found ${workoutsOnDate.length} workouts`);
  
  useEffect(() => {
    if (workoutsOnDate.length > 0 && !selectedWorkout) {
      setSelectedWorkout(workoutsOnDate[0]);
    } else if (workoutsOnDate.length === 0) {
      setSelectedWorkout(null);
      setExercises(null);
    }
  }, [workoutsOnDate, selectedWorkout]);

  useEffect(() => {
    const loadExercises = async () => {
      if (!selectedWorkout) return;
      
      setIsLoading(true);
      try {
        const exerciseData = await fetchWorkoutExercises(selectedWorkout.id);
        if (exerciseData) {
          // Process exercise data
          const exercisesMap = new Map();
          
          exerciseData.forEach((set: any) => {
            const exerciseName = set.workout_exercise?.exercise?.name || 'Unknown Exercise';
            const exerciseId = set.workout_exercise?.exercise_id || set.id;
            const key = `${exerciseId}-${exerciseName}`;
            
            if (!exercisesMap.has(key)) {
              exercisesMap.set(key, {
                id: exerciseId,
                name: exerciseName,
                type: set.workout_exercise?.exercise?.exercise_type || 'strength',
                sets: []
              });
            }
            
            exercisesMap.get(key).sets.push({
              setNumber: set.set_number,
              weight: set.weight,
              reps: set.reps_completed,
              completed: set.completed
            });
          });
          
          const processedExercises = Array.from(exercisesMap.values());
          
          // Log the exercises found
          processedExercises.forEach(exercise => {
            console.log(`Added exercise: ${exercise.name} with ${exercise.sets.length} sets`);
          });
          
          setExercises(processedExercises);
        } else {
          setExercises([]);
        }
      } catch (error) {
        console.error('Error loading exercise details:', error);
        setExercises([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, [selectedWorkout]);

  const handleDeleteWorkout = async () => {
    if (!selectedWorkout) return;
    
    try {
      // Here we would implement the deletion logic
      // For now just show a toast
      toast.success("Workout deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("Failed to delete workout");
    }
  };

  if (workoutsOnDate.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No workouts recorded for this date</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLifeHappensPass = selectedWorkout?.life_happens_pass || 
                           selectedWorkout?.workout_type === 'life_happens';
  
  return (
    <div className="space-y-4">
      {workoutsOnDate.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {workoutsOnDate.map(workout => (
            <Button
              key={workout.id}
              variant={selectedWorkout?.id === workout.id ? "default" : "outline"}
              onClick={() => setSelectedWorkout(workout)}
              className="truncate"
            >
              {workout.title || workout.workout?.title || "Workout"}
            </Button>
          ))}
        </div>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div className="flex items-center">
            {isLifeHappensPass ? (
              <Umbrella className="h-5 w-5 mr-2 text-blue-600" />
            ) : (
              <WorkoutTypeIcon 
                type={(selectedWorkout?.workout_type || selectedWorkout?.workout?.workout_type || 'strength') as any} 
                className="h-5 w-5 mr-2" 
              />
            )}
            <CardTitle className="text-xl">
              {selectedWorkout?.title || selectedWorkout?.workout?.title || "Workout Details"}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4">
          {/* Only show the "credit used" text for non-life-happens workouts */}
          {!isLifeHappensPass && selectedWorkout?.description && (
            <p className="text-muted-foreground mb-4">{selectedWorkout.description}</p>
          )}
          
          {/* Show user timezone */}
          <p className="text-sm text-muted-foreground mb-4">
            User timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </p>
          
          <div className="space-y-4">
            {isLifeHappensPass ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="font-medium flex items-center">
                  <Umbrella className="h-4 w-4 mr-2 text-blue-600" />
                  Life Happens Pass Used
                </div>
              </div>
            ) : exercises ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Exercise Details</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setExercisesExpanded(!exercisesExpanded)}
                  >
                    {exercisesExpanded ? (
                      <ChevronUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    )}
                    {exercisesExpanded ? "Collapse" : "Expand"}
                  </Button>
                </div>
                
                {isLoading && <p className="text-sm text-muted-foreground">Loading exercise details...</p>}
                
                {exercisesExpanded && exercises.length > 0 && (
                  <div className="space-y-4 mt-2">
                    {exercises.map((exercise, index) => (
                      <div key={`${exercise.id}-${index}`} className="border rounded-lg p-3">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <div className="grid grid-cols-4 gap-1 text-xs font-medium text-muted-foreground mt-2">
                          <div>Set</div>
                          <div>Weight</div>
                          <div>Reps</div>
                          <div>Status</div>
                        </div>
                        {exercise.sets.map((set: any) => (
                          <div 
                            key={`set-${set.setNumber}`} 
                            className="grid grid-cols-4 gap-1 text-sm border-t py-1"
                          >
                            <div>{set.setNumber}</div>
                            <div>{set.weight || 'N/A'}</div>
                            <div>{set.reps || 'N/A'}</div>
                            <div>{set.completed ? '✅' : '❌'}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    asChild 
                    size="sm" 
                    className="w-full"
                  >
                    <Link to={`/client-dashboard/workouts/edit/${selectedWorkout?.id}`}>
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit Exercises
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No exercise details available.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <WorkoutJournalSection workoutId={selectedWorkout?.id || ''} />
      
      {selectedWorkout && (
        <div className="flex justify-between gap-2">
          <Button 
            variant="outline" 
            asChild 
            className="flex-1"
          >
            <Link to={`/client-dashboard/workouts/edit/${selectedWorkout.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Date
            </Link>
          </Button>
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Workout</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this workout? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteWorkout}>
                  Delete Workout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};
