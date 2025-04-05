
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Check, Dumbbell, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutExercise, WorkoutSetCompletion } from '@/types/workout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface WorkoutSetCompletionsProps {
  workoutCompletionId: string;
  workoutExercises: any[];
  readOnly?: boolean;
}

const WorkoutSetCompletions: React.FC<WorkoutSetCompletionsProps> = ({ 
  workoutCompletionId, 
  workoutExercises,
  readOnly = false
}) => {
  const [completions, setCompletions] = useState<Record<string, WorkoutSetCompletion[]>>({});
  const [updatingSetId, setUpdatingSetId] = useState<string | null>(null);
  
  const { data: workoutSetCompletions, isLoading, error } = useQuery({
    queryKey: ['workout-set-completions', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_set_completions')
        .select('*')
        .eq('workout_completion_id', workoutCompletionId)
        .order('set_number', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workoutCompletionId
  });
  
  // Group completions by workout_exercise_id
  useEffect(() => {
    if (workoutSetCompletions) {
      const grouped: Record<string, WorkoutSetCompletion[]> = {};
      workoutSetCompletions.forEach((set) => {
        if (!grouped[set.workout_exercise_id]) {
          grouped[set.workout_exercise_id] = [];
        }
        grouped[set.workout_exercise_id].push(set);
      });
      setCompletions(grouped);
    }
  }, [workoutSetCompletions]);
  
  const handleUpdateSet = async (setId: string, field: string, value: any) => {
    if (readOnly) return;
    
    try {
      setUpdatingSetId(setId);
      
      const { error } = await supabase
        .from('workout_set_completions')
        .update({ [field]: value, completed: true })
        .eq('id', setId);
      
      if (error) {
        console.error('Error updating workout set:', error);
        toast.error('Failed to update set');
      }
    } catch (err) {
      console.error('Error in handleUpdateSet:', err);
      toast.error('Failed to update set');
    } finally {
      setUpdatingSetId(null);
    }
  };
  
  const createWorkoutSets = async (exerciseId: string, sets: number) => {
    if (readOnly) return;
    
    try {
      // Check if sets already exist for this exercise
      if (completions[exerciseId] && completions[exerciseId].length > 0) {
        return;
      }
      
      // Create sets for this exercise
      const setsToCreate = Array.from({ length: sets }, (_, i) => ({
        workout_completion_id: workoutCompletionId,
        workout_exercise_id: exerciseId,
        set_number: i + 1,
        completed: false,
        created_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('workout_set_completions')
        .insert(setsToCreate)
        .select();
      
      if (error) {
        console.error('Error creating workout sets:', error);
        toast.error('Failed to create sets');
        return;
      }
      
      // Update the local state with the new sets
      setCompletions(prev => ({
        ...prev,
        [exerciseId]: data
      }));
      
    } catch (err) {
      console.error('Error in createWorkoutSets:', err);
      toast.error('Failed to create workout sets');
    }
  };
  
  useEffect(() => {
    // Auto-create workout sets for each exercise if they don't exist
    if (workoutExercises && workoutExercises.length > 0) {
      workoutExercises.forEach((exercise) => {
        if (exercise.sets && (!completions[exercise.id] || completions[exercise.id].length === 0)) {
          createWorkoutSets(exercise.id, exercise.sets);
        }
      });
    }
  }, [workoutExercises, completions, workoutCompletionId]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading exercise data...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-200 rounded-md">
        Error loading workout exercises. Please try again.
      </div>
    );
  }
  
  if (workoutExercises.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No exercises found for this workout.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {workoutExercises.map((exercise) => {
          const exerciseSets = completions[exercise.id] || [];
          const isCardio = exercise.exercise?.exercise_type === 'cardio';
          
          return (
            <AccordionItem key={exercise.id} value={exercise.id} className="border rounded-md mb-3">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {isCardio ? (
                      <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    ) : (
                      <Dumbbell className="w-5 h-5 mr-2 text-purple-500" />
                    )}
                    <div className="text-left">
                      <h4 className="font-medium">{exercise.exercise?.name}</h4>
                      <div className="flex gap-2 mt-1">
                        {!isCardio && (
                          <Badge variant="outline" className="text-xs">
                            {exercise.sets} sets × {exercise.reps}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          {exercise.exercise?.category || 'Uncategorized'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {exerciseSets.length > 0 && exerciseSets.every(set => set.completed) && (
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 py-2">
                {exercise.notes && (
                  <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <strong>Instructions:</strong> {exercise.notes}
                  </div>
                )}
                
                {isCardio ? (
                  // Cardio exercise (duration based)
                  <div className="mb-3">
                    <label className="text-sm font-medium block mb-1">Duration</label>
                    {exerciseSets.length > 0 ? (
                      <Input
                        value={exerciseSets[0]?.duration || ''}
                        onChange={(e) => handleUpdateSet(exerciseSets[0].id, 'duration', e.target.value)}
                        placeholder="hh:mm:ss"
                        className="w-full"
                        disabled={readOnly}
                      />
                    ) : (
                      <div className="flex justify-center my-3">
                        <Button 
                          size="sm" 
                          onClick={() => createWorkoutSets(exercise.id, 1)}
                          disabled={readOnly}
                        >
                          Add Duration
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Weight training exercise (sets and reps)
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-500">
                      <div className="col-span-3">Set</div>
                      <div className="col-span-4">Reps</div>
                      <div className="col-span-5">Weight</div>
                    </div>
                    
                    {exerciseSets.length > 0 ? (
                      exerciseSets.map((set) => (
                        <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-3 text-sm font-medium">
                            {set.set_number}
                            {updatingSetId === set.id && (
                              <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />
                            )}
                          </div>
                          <div className="col-span-4">
                            <Input 
                              type="number"
                              value={set.reps_completed || ''}
                              onChange={(e) => handleUpdateSet(set.id, 'reps_completed', parseInt(e.target.value) || 0)}
                              placeholder={exercise.reps}
                              className="h-8 text-sm"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="col-span-5">
                            <Input 
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => handleUpdateSet(set.id, 'weight', parseFloat(e.target.value) || 0)}
                              placeholder="Weight"
                              className="h-8 text-sm"
                              step="0.5"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-center my-3">
                        <Button 
                          size="sm" 
                          onClick={() => createWorkoutSets(exercise.id, exercise.sets)}
                          disabled={readOnly}
                        >
                          Add Sets
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default WorkoutSetCompletions;
