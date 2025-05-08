
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Exercise } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCustomWorkout,
  createCustomWorkoutExercise,
  CreateCustomWorkoutExerciseParams
} from '@/services/client-custom-workout-service';
import { WorkoutType } from './WorkoutTypeIcon';
import { CustomExerciseItem } from './custom-workout/types';
import { WorkoutForm } from './custom-workout/WorkoutForm';
import { ExerciseList } from './custom-workout/ExerciseList';
import { isCardioExercise } from './custom-workout/ExerciseItem';

const CreateCustomWorkout = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number | undefined>();
  const [workoutType, setWorkoutType] = useState<WorkoutType>('custom');
  const [exercises, setExercises] = useState<CustomExerciseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddExercise = (exercise: Exercise) => {
    if (isCardioExercise(exercise.name)) {
      setExercises(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          exercise,
        }
      ]);
    } else {
      setExercises(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          exercise,
          sets: 3,
          reps: '10',
          rest: 60
        }
      ]);
    }
  };

  const handleAddCustomExercise = () => {
    setExercises(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        customName: '',
        sets: 3,
        reps: '10',
        rest: 60
      }
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, updates: Partial<CustomExerciseItem>) => {
    setExercises(prev => 
      prev.map((ex, i) => i === index ? { ...ex, ...updates } : ex)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error('Please enter a workout title');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const workout = await createCustomWorkout({
        title,
        description: description || undefined,
        duration_minutes: duration,
        workout_type: workoutType
      });
      
      if (exercises.length > 0) {
        const exercisePromises = exercises.map((ex, index) => {
          const isCardio = ex.exercise 
            ? isCardioExercise(ex.exercise.name) 
            : ex.customName 
              ? isCardioExercise(ex.customName) 
              : false;
          
          const params: CreateCustomWorkoutExerciseParams = {
            workout_id: workout.id,
            exercise_id: ex.exercise?.id,
            custom_exercise_name: ex.customName || null,
            sets: isCardio ? null : ex.sets || null,
            reps: isCardio ? null : ex.reps || null,
            rest_seconds: isCardio ? null : ex.rest || null,
            notes: ex.notes || null,
            order_index: index
          };
          
          return createCustomWorkoutExercise(params);
        });
        
        await Promise.all(exercisePromises);
      }
      
      toast.success('Custom workout created successfully!');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error creating custom workout:', error);
      toast.error('Failed to create custom workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create Your Own Workout</h1>
        <p className="text-muted-foreground">
          Build a custom workout with exercises from our database or add your own.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <WorkoutForm 
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          duration={duration}
          setDuration={setDuration}
          workoutType={workoutType}
          setWorkoutType={setWorkoutType}
        />
        
        <ExerciseList 
          exercises={exercises}
          updateExercise={updateExercise}
          handleRemoveExercise={handleRemoveExercise}
          handleAddExercise={handleAddExercise}
          handleAddCustomExercise={handleAddCustomExercise}
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="w-full md:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Workout'}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCustomWorkout;
