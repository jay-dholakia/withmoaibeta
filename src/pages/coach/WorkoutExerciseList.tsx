
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { 
  fetchWorkout, 
  fetchWorkoutExercises,
  fetchSupersetGroups
} from '@/services/workout-service';
import { Workout, WorkoutExercise, SupersetGroup } from '@/types/workout';
import SupersetManager from '@/components/coach/SupersetManager';
import SupersetGroupComponent from '@/components/coach/SupersetGroup';

const WorkoutExerciseList: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [supersetGroups, setSupersetGroups] = useState<SupersetGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkoutData = async () => {
    if (!workoutId) return;
    
    try {
      setLoading(true);
      const [workoutData, exercisesData, supersetData] = await Promise.all([
        fetchWorkout(workoutId),
        fetchWorkoutExercises(workoutId),
        fetchSupersetGroups(workoutId)
      ]);

      setWorkout(workoutData);
      setExercises(exercisesData);
      setSupersetGroups(supersetData);
    } catch (error) {
      console.error('Error loading workout data:', error);
      toast.error('Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkoutData();
  }, [workoutId]);

  const handleSupersetCreated = () => {
    loadWorkoutData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Prepare a list of exercises that are not in a superset
  const standaloneExercises = exercises.filter(ex => !ex.superset_group_id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Workout Exercises</h2>
        <SupersetManager
          workoutId={workoutId || ''}
          exercises={exercises}
          onSupersetCreated={handleSupersetCreated}
          onError={(message) => toast.error(message)}
        />
      </div>

      {/* Display superset groups */}
      {supersetGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Supersets</h3>
          {supersetGroups.map(group => (
            <SupersetGroupComponent
              key={group.id}
              supersetGroup={group}
              workoutExercises={exercises}
              onUpdate={loadWorkoutData}
              onDelete={loadWorkoutData}
            />
          ))}
        </div>
      )}

      {/* Display standalone exercises */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exercises</h3>
        {standaloneExercises.length === 0 ? (
          <p className="text-muted-foreground">No exercises added yet.</p>
        ) : (
          <div className="space-y-2">
            {standaloneExercises.map(exercise => (
              <div 
                key={exercise.id}
                className="p-3 border rounded-md flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {exercise.exercise?.name || 'Exercise'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {exercise.sets} sets × {exercise.reps} reps
                  </div>
                </div>
                {/* Add exercise actions here if needed */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutExerciseList;
