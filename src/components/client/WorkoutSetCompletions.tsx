
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, SubscriptionManager } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Check, Dumbbell, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutExercise, WorkoutSetCompletion } from '@/types/workout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface WorkoutSetCompletionsProps {
  workoutId: string;
  workoutExercises: any[];
  readOnly?: boolean;
}

const WorkoutSetCompletions: React.FC<WorkoutSetCompletionsProps> = ({ 
  workoutId, 
  workoutExercises,
  readOnly = false
}) => {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<Record<string, WorkoutSetCompletion[]>>({});
  const [updatingSetId, setUpdatingSetId] = useState<string | null>(null);
  const [workoutCompletionId, setWorkoutCompletionId] = useState<string | null>(null);
  
  // First, check if we already have a workout_completion record for this workout
  const { data: existingCompletion, isLoading: isLoadingCompletion } = useQuery({
    queryKey: ['current-workout-completion', workoutId],
    queryFn: async () => {
      if (!workoutId || !user?.id) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('workout_id', workoutId)
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .is('completed_at', null) // Only get incomplete workouts
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) {
        console.error('Error checking for existing workout completion:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!workoutId && !!user?.id
  });
  
  // Create a workout completion record if we don't have one
  useEffect(() => {
    const createWorkoutCompletion = async () => {
      if (!workoutId || !user?.id || isLoadingCompletion || existingCompletion) return;
      
      try {
        const { data, error } = await supabase
          .from('workout_completions')
          .insert({
            workout_id: workoutId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (error) {
          console.error('Error creating workout completion:', error);
          return;
        }
        
        setWorkoutCompletionId(data.id);
      } catch (err) {
        console.error('Error in createWorkoutCompletion:', err);
      }
    };
    
    if (!isLoadingCompletion) {
      if (existingCompletion) {
        setWorkoutCompletionId(existingCompletion.id);
      } else {
        createWorkoutCompletion();
      }
    }
  }, [workoutId, user?.id, isLoadingCompletion, existingCompletion]);
  
  const { data: workoutSetCompletions, isLoading, error } = useQuery({
    queryKey: ['workout-set-completions', workoutCompletionId],
    queryFn: async () => {
      if (!workoutCompletionId) return [];
      
      const { data, error } = await supabase
        .from('workout_set_completions')
        .select('*')
        .eq('workout_completion_id', workoutCompletionId)
        .order('set_number', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workoutCompletionId,
    retry: 2,
    staleTime: 30000,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 8000),
  });
  
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
  
  const handleUpdateSet = debounce(async (setId: string, field: string, value: any) => {
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
  }, 500);
  
  const createWorkoutSets = async (exerciseId: string, sets: number) => {
    if (readOnly || !workoutCompletionId) return;
    
    try {
      if (completions[exerciseId] && completions[exerciseId].length > 0) {
        return;
      }
      
      const setsToCreate = Array.from({ length: sets }, (_, i) => ({
        workout_completion_id: workoutCompletionId,
        workout_exercise_id: exerciseId,
        set_number: i + 1,
        completed: false,
        user_id: user?.id,
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
    if (!workoutCompletionId) return;
    
    const initializeMissingSets = async () => {
      if (workoutExercises && workoutExercises.length > 0) {
        const exercisesNeedingSets = workoutExercises.filter(exercise => 
          exercise.sets && (!completions[exercise.id] || completions[exercise.id].length === 0)
        );
        
        for (let i = 0; i < Math.min(exercisesNeedingSets.length, 3); i++) {
          const exercise = exercisesNeedingSets[i];
          await createWorkoutSets(exercise.id, exercise.sets);
        }
      }
    };
    
    if (workoutSetCompletions && workoutExercises.length > 0) {
      initializeMissingSets();
    }
    
    if (workoutCompletionId) {
      const channel = SubscriptionManager.getSubscription(
        `workout-sets-${workoutCompletionId}`, 
        () => {
          const channel = supabase.channel(`workout-sets-${workoutCompletionId}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'workout_set_completions',
              filter: `workout_completion_id=eq.${workoutCompletionId}`
            }, (payload) => {
              console.log('Workout set update received:', payload);
              window.dispatchEvent(new CustomEvent('refresh-workout-sets'));
            })
            .subscribe((status) => {
              console.log(`Workout sets subscription status: ${status}`);
            });
          
          return channel;
        }
      );
      
      const handleRefresh = () => {
        window.dispatchEvent(new CustomEvent('refetch-workout-sets'));
      };
      
      window.addEventListener('refresh-workout-sets', handleRefresh);
      
      return () => {
        window.removeEventListener('refresh-workout-sets', handleRefresh);
        SubscriptionManager.releaseSubscription(`workout-sets-${workoutCompletionId}`);
        handleUpdateSet.cancel();
      };
    }
  }, [workoutCompletionId, workoutExercises, workoutSetCompletions, completions]);
  
  if (isLoadingCompletion || !workoutCompletionId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Setting up workout session...</span>
      </div>
    );
  }
  
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
                              placeholder={String(exercise.reps)}
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
