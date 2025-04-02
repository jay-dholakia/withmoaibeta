
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WorkoutHistoryItem } from '@/types/workout';
import { format, isValid } from 'date-fns';
import { FileX, Edit, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkoutTypeIcon, WORKOUT_TYPES } from './WorkoutTypeIcon';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from 'sonner';
import { updateCustomWorkout } from '@/services/client-custom-workout-service';
import { updateWorkoutCompletion } from '@/services/workout-edit-service';
import EditWorkoutSetCompletions from './EditWorkoutSetCompletions';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
}

export const WorkoutDayDetails: React.FC<WorkoutDayDetailsProps> = ({ date, workouts }) => {
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [exerciseGroups, setExerciseGroups] = useState<Record<string, any>>({});
  const [editingExercises, setEditingExercises] = useState(false);
  
  // Form state for editing
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState<number | null>(null);
  const [editWorkoutType, setEditWorkoutType] = useState<string>('strength');
  const [editNotes, setEditNotes] = useState('');

  // Fetch exercise details for a workout
  useEffect(() => {
    const fetchWorkoutExerciseDetails = async (workout: WorkoutHistoryItem) => {
      if (!workout.id || !workout.workout_set_completions || workout.workout_set_completions.length === 0) {
        return;
      }

      try {
        // Group the set completions by exercise
        const groups: Record<string, any> = {};
        
        for (const setCompletion of workout.workout_set_completions) {
          const exerciseId = setCompletion.workout_exercise_id;
          
          if (!groups[exerciseId]) {
            // Get exercise information
            const { data: exerciseInfo, error } = await supabase
              .from('workout_exercises')
              .select('*, exercise:exercises(name, exercise_type)')
              .eq('id', exerciseId)
              .single();

            if (error) {
              console.error("Error fetching exercise info:", error);
              continue;
            }

            groups[exerciseId] = {
              name: exerciseInfo.exercise ? exerciseInfo.exercise.name : 'Unknown Exercise',
              type: exerciseInfo.exercise ? exerciseInfo.exercise.exercise_type : 'strength',
              sets: []
            };
          }
          
          groups[exerciseId].sets.push(setCompletion);
        }
        
        setExerciseGroups(prev => ({
          ...prev,
          [workout.id]: groups
        }));
      } catch (error) {
        console.error("Error fetching workout exercise details:", error);
      }
    };

    if (expandedWorkoutId) {
      const workout = workouts.find(w => w.id === expandedWorkoutId);
      if (workout && !exerciseGroups[expandedWorkoutId]) {
        fetchWorkoutExerciseDetails(workout);
      }
    }
  }, [expandedWorkoutId, workouts]);

  if (!date || !isValid(date)) {
    return (
      <Card className="text-center py-6">
        <CardContent>
          <FileX className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium">Invalid Date Selected</h3>
          <p className="text-muted-foreground">Please select a valid date to view workouts.</p>
        </CardContent>
      </Card>
    );
  }

  const handleEditWorkout = (workout: WorkoutHistoryItem) => {
    setEditTitle(workout.title || '');
    setEditDescription(workout.description || '');
    setEditDuration(workout.duration ? parseInt(workout.duration) : null);
    setEditWorkoutType(workout.workout_type || 'custom');
    setEditNotes(workout.notes || '');
    setEditingWorkoutId(workout.id);
  };

  const handleCancelEdit = () => {
    setEditingWorkoutId(null);
  };

  const handleSaveWorkout = async (workout: WorkoutHistoryItem) => {
    try {
      setIsSaving(true);
      
      if (workout.custom_workout_id) {
        // Update existing custom workout
        await updateCustomWorkout(workout.custom_workout_id, {
          title: editTitle,
          description: editDescription || null,
          duration_minutes: editDuration,
          workout_type: editWorkoutType
        });
      } else {
        // Update workout completion entry directly
        await updateWorkoutCompletion(workout.id, {
          title: editTitle,
          description: editDescription || null,
          duration: editDuration ? editDuration.toString() : null,
          workout_type: editWorkoutType,
          notes: editNotes
        });
      }
      
      // Refresh the page to show updated data
      document.getElementById('refresh-workout-history')?.click();
      
      setEditingWorkoutId(null);
      toast.success('Workout updated successfully');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date): string => {
    try {
      return format(date, 'MMMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  // Function to determine if a workout is editable
  const isWorkoutEditable = (workout: WorkoutHistoryItem): boolean => {
    return Boolean(workout.custom_workout_id) || // Has a custom workout ID
           Boolean(workout.title) || // Has a title (could be one-off entry)
           (workout.workout_type === 'one_off' || workout.workout_type === 'custom'); // Is a one-off or custom workout
  };

  // Toggle expanded view of workout details
  const toggleWorkoutExpand = (workoutId: string) => {
    if (expandedWorkoutId === workoutId) {
      setExpandedWorkoutId(null);
    } else {
      setExpandedWorkoutId(workoutId);
    }
  };

  // Handle editing exercise details
  const handleEditExercises = (workout: WorkoutHistoryItem) => {
    setEditingExercises(true);
  };

  // Save edited exercise data callback
  const handleExercisesSaved = () => {
    // Refresh data after saving
    document.getElementById('refresh-workout-history')?.click();
    setEditingExercises(false);
  };

  if (workouts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-lg font-medium">{formatDate(date)}</p>
            <p className="text-muted-foreground mt-2">No workouts found for this date.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-lg font-medium">{formatDate(date)}</p>
      </div>

      {workouts.map((workout) => (
        <Card key={workout.id} className="overflow-hidden">
          <CardContent className="p-4">
            {editingWorkoutId === workout.id ? (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="title">Workout Title</Label>
                    <Input
                      id="title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Enter workout title"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="workout-type">Workout Type</Label>
                    <Select
                      value={editWorkoutType}
                      onValueChange={setEditWorkoutType}
                    >
                      <SelectTrigger id="workout-type" className="mt-1">
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKOUT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={editDuration || ''}
                      onChange={(e) => setEditDuration(e.target.value ? Number(e.target.value) : null)}
                      placeholder="Enter duration in minutes"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Enter workout description"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Enter workout notes"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleSaveWorkout(workout)}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {workout.workout_type && (
                        <WorkoutTypeIcon 
                          type={workout.workout_type as any} 
                          className="text-xl"
                        />
                      )}
                      <h3 className="text-lg font-medium">
                        {workout.title || workout.workout?.title || 'Unnamed Workout'}
                      </h3>
                    </div>
                    
                    {(workout.completed_at) && (
                      <p className="text-sm text-muted-foreground">
                        Completed at {new Date(workout.completed_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {workout.workout_set_completions && workout.workout_set_completions.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleWorkoutExpand(workout.id)}
                        className="text-xs"
                      >
                        {expandedWorkoutId === workout.id ? (
                          <ChevronUp className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        )}
                        {expandedWorkoutId === workout.id ? 'Collapse' : 'Expand'}
                      </Button>
                    )}

                    {isWorkoutEditable(workout) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditWorkout(workout)}
                        className="text-xs"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                
                {(workout.description || workout.workout?.description) && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">
                      {workout.description || workout.workout?.description}
                    </p>
                  </div>
                )}
                
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {workout.duration && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Duration:</span> {workout.duration} minutes
                    </div>
                  )}
                  
                  {workout.distance && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Distance:</span> {workout.distance}
                    </div>
                  )}
                  
                  {workout.location && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Location:</span> {workout.location}
                    </div>
                  )}
                </div>
                
                {expandedWorkoutId === workout.id && workout.workout_set_completions && workout.workout_set_completions.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Exercise Details</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditExercises(workout)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit Exercises
                      </Button>
                    </div>
                    
                    {exerciseGroups[workout.id] ? (
                      <div className="space-y-3">
                        {Object.entries(exerciseGroups[workout.id]).map(([exerciseId, group]: [string, any]) => (
                          <div key={exerciseId} className="bg-muted/50 p-2 rounded-md">
                            <div className="font-medium">{group.name}</div>
                            
                            {group.type === 'cardio' ? (
                              <div className="text-sm mt-1">
                                <span className="text-muted-foreground">Duration: </span>
                                {group.sets[0]?.duration || 'Not recorded'}
                                
                                {group.sets[0]?.notes && (
                                  <div className="mt-1">
                                    <span className="text-muted-foreground">Notes: </span>
                                    {group.sets[0].notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground mt-1">
                                <div>Set</div>
                                <div>Reps</div>
                                <div>Weight</div>
                              </div>
                            )}
                            
                            {group.type !== 'cardio' && group.sets.sort((a: any, b: any) => a.set_number - b.set_number).map((set: any) => (
                              <div key={set.id} className="grid grid-cols-3 text-sm mt-1">
                                <div>{set.set_number}</div>
                                <div>{set.reps_completed || '-'}</div>
                                <div>{set.weight ? `${set.weight} lbs` : '-'}</div>
                              </div>
                            ))}
                            
                            {group.type !== 'cardio' && group.sets[0]?.notes && (
                              <div className="text-xs mt-2">
                                <span className="text-muted-foreground">Notes: </span>
                                {group.sets[0].notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        Loading exercise details...
                      </div>
                    )}
                  </div>
                )}
                
                {workout.notes && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium">Notes:</div>
                    <p className="text-muted-foreground">{workout.notes}</p>
                  </div>
                )}
                
                {workout.rating && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium">Rating:</div>
                    <div className="text-muted-foreground">
                      {'★'.repeat(workout.rating)}{'☆'.repeat(5 - workout.rating)}
                    </div>
                  </div>
                )}
                
                {workout.rest_day && (
                  <div className="mt-3 text-sm bg-muted inline-block px-2 py-1 rounded-md">
                    Rest Day
                  </div>
                )}
                
                {workout.life_happens_pass && (
                  <div className="mt-3 text-sm bg-muted inline-block px-2 py-1 rounded-md">
                    Life Happens Pass Used
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Dialog for editing exercise sets */}
      {editingExercises && expandedWorkoutId && (
        <EditWorkoutSetCompletions
          open={editingExercises}
          onOpenChange={setEditingExercises}
          workout={workouts.find(w => w.id === expandedWorkoutId)!}
          exerciseGroups={exerciseGroups[expandedWorkoutId] || {}}
          onSave={handleExercisesSaved}
        />
      )}
    </div>
  );
};
