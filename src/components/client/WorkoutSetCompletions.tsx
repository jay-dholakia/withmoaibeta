
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, SubscriptionManager } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Check, Dumbbell, Clock, Video, Info } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutExercise, WorkoutSetCompletion } from '@/types/workout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ExerciseVideoDialog from './ExerciseVideoDialog';
import { Checkbox } from '@/components/ui/checkbox';

interface WorkoutSetCompletionsProps {
  workoutId: string;
  workoutExercises: any[];
  readOnly?: boolean;
}

interface TempSet {
  setNumber: number;
  reps: string;
  weight: string;
  completed: boolean;
}

const WorkoutSetCompletions: React.FC<WorkoutSetCompletionsProps> = ({ 
  workoutId, 
  workoutExercises,
  readOnly = false
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [completions, setCompletions] = useState<Record<string, WorkoutSetCompletion[]>>({});
  const [tempSets, setTempSets] = useState<Record<string, TempSet[]>>({});
  const [updatingSetId, setUpdatingSetId] = useState<string | null>(null);
  const [workoutCompletionId, setWorkoutCompletionId] = useState<string | null>(null);
  const [videoDialog, setVideoDialog] = useState<{
    isOpen: boolean;
    exerciseId: string | null;
    exerciseName: string;
    youtubeUrl?: string;
  }>({
    isOpen: false,
    exerciseId: null,
    exerciseName: '',
    youtubeUrl: undefined
  });
  
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
        .is('completed_at', null)
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
  
  useEffect(() => {
    if (!isLoadingCompletion && existingCompletion) {
      setWorkoutCompletionId(existingCompletion.id);
    }
  }, [existingCompletion, isLoadingCompletion]);
  
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
  
  useEffect(() => {
    const initialTempSets: Record<string, TempSet[]> = {};
    workoutExercises.forEach(exercise => {
      if (exercise.exercise?.exercise_type === 'cardio') return;
      
      if (!completions[exercise.id] || completions[exercise.id].length === 0) {
        initialTempSets[exercise.id] = Array.from(
          { length: exercise.sets }, 
          (_, i) => ({ setNumber: i + 1, reps: "", weight: "", completed: false })
        );
      }
    });
    
    setTempSets(prev => ({...prev, ...initialTempSets}));
  }, [workoutExercises, completions]);
  
  const handleUpdateSet = debounce(async (setId: string, field: string, value: any) => {
    if (readOnly) return;
    
    try {
      setUpdatingSetId(setId);
      
      const { error } = await supabase
        .from('workout_set_completions')
        .update({ [field]: value })
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

  const handleToggleCompleted = async (setId: string, isCompleted: boolean) => {
    if (readOnly) return;
    
    try {
      setUpdatingSetId(setId);
      
      const { error } = await supabase
        .from('workout_set_completions')
        .update({ completed: isCompleted })
        .eq('id', setId);
      
      if (error) {
        console.error('Error updating set completion status:', error);
        toast.error('Failed to update set completion status');
      }
    } catch (err) {
      console.error('Error in handleToggleCompleted:', err);
      toast.error('Failed to update set completion status');
    } finally {
      setUpdatingSetId(null);
      
      queryClient.invalidateQueries({ 
        queryKey: ['workout-set-completions', workoutCompletionId] 
      });
    }
  };

  const handleUpdateTempSet = (exerciseId: string, setNumber: number, field: string, value: any) => {
    setTempSets(prev => {
      const updatedSets = [...(prev[exerciseId] || [])];
      const setIndex = updatedSets.findIndex(set => set.setNumber === setNumber);
      
      if (setIndex >= 0) {
        updatedSets[setIndex] = { 
          ...updatedSets[setIndex],
          [field]: value 
        };
      }
      
      return {
        ...prev,
        [exerciseId]: updatedSets
      };
    });
  };
  
  const saveTempSetsToWorkoutCompletion = async (exerciseId: string, newWorkoutCompletionId: string) => {
    if (!tempSets[exerciseId] || tempSets[exerciseId].length === 0) return;
    
    try {
      const setsToCreate = tempSets[exerciseId].map(tempSet => ({
        workout_completion_id: newWorkoutCompletionId,
        workout_exercise_id: exerciseId,
        set_number: tempSet.setNumber,
        reps_completed: tempSet.reps ? parseInt(tempSet.reps) : null,
        weight: tempSet.weight ? parseFloat(tempSet.weight) : null,
        completed: tempSet.completed,
        user_id: user?.id,
        created_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('workout_set_completions')
        .insert(setsToCreate)
        .select();
      
      if (error) {
        console.error('Error saving temp sets:', error);
        return;
      }
      
      setTempSets(prev => {
        const updated = {...prev};
        delete updated[exerciseId];
        return updated;
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['workout-set-completions', newWorkoutCompletionId] 
      });
      
    } catch (err) {
      console.error('Error in saveTempSetsToWorkoutCompletion:', err);
    }
  };
  
  const createWorkoutSets = async (exerciseId: string, sets: number) => {
    if (readOnly || !workoutCompletionId) return;
    
    try {
      if (completions[exerciseId] && completions[exerciseId].length > 0) {
        return;
      }
      
      const setsToCreate = Array.from({ length: sets }, (_, i) => {
        const tempSet = tempSets[exerciseId]?.find(ts => ts.setNumber === i + 1);
        
        return {
          workout_completion_id: workoutCompletionId,
          workout_exercise_id: exerciseId,
          set_number: i + 1,
          reps_completed: tempSet?.reps ? parseInt(tempSet.reps) : null,
          weight: tempSet?.weight ? parseFloat(tempSet.weight) : null,
          completed: tempSet?.completed || false,
          user_id: user?.id,
          created_at: new Date().toISOString()
        };
      });
      
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
      
      setTempSets(prev => {
        const updated = {...prev};
        delete updated[exerciseId];
        return updated;
      });
      
    } catch (err) {
      console.error('Error in createWorkoutSets:', err);
      toast.error('Failed to create workout sets');
    }
  };
  
  React.useEffect(() => {
    if (window) {
      (window as any).saveTempSetsToWorkoutCompletion = async (newWorkoutCompletionId: string) => {
        for (const exerciseId of Object.keys(tempSets)) {
          await saveTempSetsToWorkoutCompletion(exerciseId, newWorkoutCompletionId);
        }
      };
    }
    
    return () => {
      if (window && (window as any).saveTempSetsToWorkoutCompletion) {
        delete (window as any).saveTempSetsToWorkoutCompletion;
      }
    };
  }, [tempSets]);
  
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
  
  const handleOpenVideoDialog = (exerciseId: string, exerciseName: string, youtubeUrl?: string) => {
    if (!youtubeUrl) return;
    
    setVideoDialog({
      isOpen: true,
      exerciseId,
      exerciseName,
      youtubeUrl
    });
  };
  
  const handleCloseVideoDialog = () => {
    setVideoDialog({
      isOpen: false,
      exerciseId: null,
      exerciseName: '',
      youtubeUrl: undefined
    });
  };
  
  if (isLoadingCompletion) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading workout session...</span>
      </div>
    );
  }
  
  if (isLoading && workoutCompletionId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading exercise data...</span>
      </div>
    );
  }
  
  if (error && workoutCompletionId) {
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
  
  const renderTempSets = (exercise: any) => {
    const exerciseSets = tempSets[exercise.id] || [];
    const isCardio = exercise.exercise?.exercise_type === 'cardio';
    
    if (isCardio) {
      return (
        <div className="mb-3">
          <label className="text-sm font-medium block mb-1">Duration</label>
          <Input
            value={exerciseSets[0]?.reps || ''}
            onChange={(e) => handleUpdateTempSet(exercise.id, 1, 'reps', e.target.value)}
            placeholder="hh:mm:ss"
            className="w-full"
          />
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-3 mb-2 text-xs font-medium text-gray-500">
            <div className="col-span-3 text-center">Set</div>
            <div className="col-span-3 text-center">Reps</div>
            <div className="col-span-4 text-center">Weight</div>
            <div className="col-span-2 text-center">Done</div>
          </div>
          
          {Array.from({ length: exercise.sets }, (_, i) => {
            const setNumber = i + 1;
            const tempSet = exerciseSets.find(set => set.setNumber === setNumber) || {
              setNumber,
              reps: "",
              weight: "",
              completed: false
            };
            
            return (
              <div key={`temp-${exercise.id}-${setNumber}`} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 text-center font-medium">{setNumber}</div>
                <div className="col-span-3">
                  <Input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={tempSet.reps}
                    onChange={(e) => handleUpdateTempSet(exercise.id, setNumber, 'reps', e.target.value)}
                    placeholder={String(exercise.reps)}
                    className="h-8 text-sm w-full"
                  />
                </div>
                <div className="col-span-4">
                  <Input 
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={tempSet.weight}
                    onChange={(e) => handleUpdateTempSet(exercise.id, setNumber, 'weight', e.target.value)}
                    placeholder="lbs"
                    className="h-8 text-sm w-full max-w-[70px]"
                    step="0.5"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <Checkbox
                    checked={tempSet.completed}
                    onCheckedChange={(checked) => {
                      handleUpdateTempSet(exercise.id, setNumber, 'completed', !!checked);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };
  
  const renderExerciseSets = (exercise: any) => {
    const exerciseSets = completions[exercise.id] || [];
    const isCardio = exercise.exercise?.exercise_type === 'cardio';
    
    if (workoutCompletionId && exerciseSets.length > 0) {
      if (isCardio) {
        return (
          <div className="mb-3">
            <label className="text-sm font-medium block mb-1">Duration</label>
            <Input
              value={exerciseSets[0]?.duration || ''}
              onChange={(e) => handleUpdateSet(exerciseSets[0].id, 'duration', e.target.value)}
              placeholder="hh:mm:ss"
              className="w-full"
              disabled={readOnly}
            />
          </div>
        );
      } else {
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-3 mb-2 text-xs font-medium text-gray-500">
              <div className="col-span-3 text-center">Set</div>
              <div className="col-span-3 text-center">Reps</div>
              <div className="col-span-4 text-center">Weight</div>
              <div className="col-span-2 text-center">Done</div>
            </div>
            
            {exerciseSets.map((set) => (
              <div key={set.id} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 text-center font-medium">
                  {set.set_number}
                  {updatingSetId === set.id && (
                    <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />
                  )}
                </div>
                <div className="col-span-3">
                  <Input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={set.reps_completed || ''}
                    onChange={(e) => handleUpdateSet(set.id, 'reps_completed', parseInt(e.target.value) || 0)}
                    placeholder={String(exercise.reps)}
                    className="h-8 text-sm w-full px-2"
                    disabled={readOnly}
                  />
                </div>
                <div className="col-span-4">
                  <Input 
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={set.weight || ''}
                    onChange={(e) => handleUpdateSet(set.id, 'weight', parseFloat(e.target.value) || 0)}
                    placeholder="lbs"
                    className="h-8 text-sm w-full px-2 max-w-[70px]"
                    step="0.5"
                    disabled={readOnly}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <Checkbox 
                    checked={set.completed}
                    onCheckedChange={(checked) => handleToggleCompleted(set.id, !!checked)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      }
    } else if (workoutCompletionId) {
      return (
        <div className="flex justify-center my-3">
          <Button 
            size="sm" 
            onClick={() => createWorkoutSets(exercise.id, isCardio ? 1 : exercise.sets)}
            disabled={readOnly}
          >
            Add {isCardio ? 'Duration' : 'Sets'}
          </Button>
        </div>
      );
    } else {
      return renderTempSets(exercise);
    }
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {workoutExercises.map((exercise) => {
            const exerciseSets = completions[exercise.id] || [];
            const isCardio = exercise.exercise?.exercise_type === 'cardio';
            const hasVideo = !!exercise.exercise?.youtube_link;
            
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
                            <div className="text-xs text-gray-600">
                              {exercise.sets} sets × {exercise.reps}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex items-center mr-3 gap-2">
                        {hasVideo && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="h-7 w-7 text-blue-500 p-1 flex items-center justify-center cursor-pointer hover:bg-slate-100 rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenVideoDialog(
                                    exercise.id, 
                                    exercise.exercise?.name || 'Exercise', 
                                    exercise.exercise?.youtube_link
                                  );
                                }}
                              >
                                <Video className="h-5 w-5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Watch demo</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span 
                              className="h-7 w-7 text-slate-500 p-1 flex items-center justify-center cursor-pointer hover:bg-slate-100 rounded-md"
                            >
                              <Info className="h-5 w-5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{exercise.exercise?.description || 'No additional information available.'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {exerciseSets.length > 0 && exerciseSets.every(set => set.completed) && (
                        <Check className="w-5 h-5 text-green-500" />
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
                  
                  {renderExerciseSets(exercise)}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        
        <ExerciseVideoDialog
          isOpen={videoDialog.isOpen}
          onClose={handleCloseVideoDialog}
          exerciseName={videoDialog.exerciseName}
          youtubeUrl={videoDialog.youtubeUrl}
        />
      </div>
    </TooltipProvider>
  );
};

export default WorkoutSetCompletions;
