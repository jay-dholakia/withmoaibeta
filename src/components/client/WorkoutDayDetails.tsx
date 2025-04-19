import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WorkoutHistoryItem } from '@/types/workout';
import { format, isValid, parseISO } from 'date-fns';
import { FileX, Edit, Save, X, ChevronDown, ChevronUp, Trash2, Calendar } from 'lucide-react';
import { WorkoutTypeIcon, WORKOUT_TYPES } from './WorkoutTypeIcon';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from 'sonner';
import { updateCustomWorkout } from '@/services/client-custom-workout-service';
import { updateWorkoutCompletion } from '@/services/workout-edit-service';
import { deleteWorkoutCompletion } from '@/services/workout-delete-service';
import EditWorkoutSetCompletions from './EditWorkoutSetCompletions';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import WorkoutJournalSection from './WorkoutJournalSection';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [displayedWorkouts, setDisplayedWorkouts] = useState<WorkoutHistoryItem[]>(workouts);
  
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState<number | null>(null);
  const [editWorkoutType, setEditWorkoutType] = useState<string>('strength');
  const [editNotes, setEditNotes] = useState('');
  const [editCompletedDate, setEditCompletedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setDisplayedWorkouts(workouts);
  }, [workouts]);

  useEffect(() => {
    const fetchWorkoutExerciseDetails = async (workout: WorkoutHistoryItem) => {
      if (!workout.id || !workout.workout_set_completions || workout.workout_set_completions.length === 0) {
        return;
      }

      try {
        const groups: Record<string, any> = {};
        
        for (const setCompletion of workout.workout_set_completions) {
          const exerciseId = setCompletion.workout_exercise_id;
          
          if (!groups[exerciseId]) {
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
      const workout = displayedWorkouts.find(w => w.id === expandedWorkoutId);
      if (workout && !exerciseGroups[expandedWorkoutId]) {
        fetchWorkoutExerciseDetails(workout);
      }
    }
  }, [expandedWorkoutId, displayedWorkouts]);

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
    
    if (workout.completed_at) {
      try {
        const completedDate = parseISO(workout.completed_at);
        setEditCompletedDate(completedDate);
      } catch (err) {
        console.error("Error parsing completed date:", err);
        setEditCompletedDate(new Date());
      }
    } else {
      setEditCompletedDate(new Date());
    }
    
    setEditingWorkoutId(workout.id);
  };

  const handleCancelEdit = () => {
    setEditingWorkoutId(null);
    setEditCompletedDate(undefined);
    setDatePopoverOpen(false);
  };

  const handleSaveWorkout = async (workout: WorkoutHistoryItem) => {
    try {
      setIsSaving(true);
      
      const isCoachAssigned = !!workout.workout_id;
      
      if (workout.custom_workout_id && !isCoachAssigned) {
        await updateCustomWorkout(workout.custom_workout_id, {
          title: editTitle,
          description: editDescription || null,
          duration_minutes: editDuration,
          workout_type: editWorkoutType
        });
      }
      
      let formattedCompletedAt: string | null = null;
      if (editCompletedDate) {
        formattedCompletedAt = editCompletedDate.toISOString();
      }
      
      if (isCoachAssigned) {
        await updateWorkoutCompletion(workout.id, {
          completed_at: formattedCompletedAt
        });
      } else {
        await updateWorkoutCompletion(workout.id, {
          title: editTitle,
          description: editDescription || null,
          duration: editDuration ? editDuration.toString() : null,
          workout_type: editWorkoutType,
          notes: editNotes,
          completed_at: formattedCompletedAt
        });
      }
      
      document.getElementById('refresh-workout-history')?.click();
      
      setEditingWorkoutId(null);
      setEditCompletedDate(undefined);
      setDatePopoverOpen(false);
      toast.success('Workout updated successfully');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      setIsDeleting(true);
      const success = await deleteWorkoutCompletion(workoutId);
      
      if (success) {
        setDisplayedWorkouts(currentWorkouts => 
          currentWorkouts.filter(workout => workout.id !== workoutId)
        );
        
        toast.success('Workout deleted successfully');
        
        document.getElementById('refresh-workout-history')?.click();
      } else {
        toast.error('Failed to delete workout');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('An error occurred while deleting the workout');
    } finally {
      setIsDeleting(false);
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

  const formatDateShort = (date: Date): string => {
    try {
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  const isWorkoutEditable = (workout: WorkoutHistoryItem): boolean => {
    return true;
  };

  const toggleWorkoutExpand = (workoutId: string) => {
    if (expandedWorkoutId === workoutId) {
      setExpandedWorkoutId(null);
    } else {
      setExpandedWorkoutId(workoutId);
    }
  };

  const handleEditExercises = (workout: WorkoutHistoryItem) => {
    setEditingExercises(true);
  };

  const handleExercisesSaved = () => {
    document.getElementById('refresh-workout-history')?.click();
    setEditingExercises(false);
  };

  if (displayedWorkouts.length === 0) {
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
    <div>
      {displayedWorkouts.map((workout) => (
        <Card key={workout.id} className="mb-4">
          <CardContent className="p-4">
            {editingWorkoutId === workout.id ? (
              <div className="space-y-4">
                {!workout.workout_id ? (
                  <>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Workout title"
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
                  </>
                ) : (
                  <h3 className="text-lg font-medium mb-4">
                    {workout.title || workout.workout?.title || 'Unnamed Workout'}
                  </h3>
                )}
                
                <div>
                  <Label htmlFor="completion-date">Completion Date</Label>
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="completion-date"
                        variant="outline"
                        className="mt-1 w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {editCompletedDate ? (
                          formatDateShort(editCompletedDate)
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={editCompletedDate}
                        onSelect={(date) => {
                          setEditCompletedDate(date);
                          setDatePopoverOpen(false);
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {!workout.workout_id && (
                  <>
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
                  </>
                )}
                
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
                  <div className="mt-4">
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
                              <Table className="mt-1">
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-1/4 h-8 py-1 px-2">Set</TableHead>
                                    <TableHead className="w-1/4 h-8 py-1 px-2">Reps</TableHead>
                                    <TableHead className="w-1/2 h-8 py-1 px-2">Weight</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.type !== 'cardio' && group.sets.sort((a: any, b: any) => a.set_number - b.set_number).map((set: any) => (
                                    <TableRow key={set.id}>
                                      <TableCell className="py-1 px-2">{set.set_number}</TableCell>
                                      <TableCell className="py-1 px-2">{set.reps_completed || '-'}</TableCell>
                                      <TableCell className="py-1 px-2">{set.weight ? `${set.weight} lbs` : '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                            
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

                <div className="mt-4 border-t pt-3 -mx-4 px-4 -mb-4 bg-gray-50/50 rounded-b-lg">
                  <div className="flex justify-between items-center">
                    {workout.workout_set_completions && workout.workout_set_completions.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleWorkoutExpand(workout.id)}
                        className="text-xs text-gray-700 hover:bg-transparent"
                      >
                        {expandedWorkoutId === workout.id ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Expand
                          </>
                        )}
                      </Button>
                    )}
                    {!workout.workout_set_completions || workout.workout_set_completions.length === 0 ? (
                      <div></div>
                    ) : null}

                    {isWorkoutEditable(workout) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditWorkout(workout)}
                        className="text-xs text-gray-700 hover:bg-transparent"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {!!workout.workout_id ? 'Edit Date' : 'Edit'}
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-xs text-destructive hover:bg-transparent"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
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
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {editingExercises && expandedWorkoutId && (
        <EditWorkoutSetCompletions
          open={editingExercises}
          onOpenChange={setEditingExercises}
          workout={displayedWorkouts.find(w => w.id === expandedWorkoutId)!}
          exerciseGroups={exerciseGroups[expandedWorkoutId] || {}}
          onSave={handleExercisesSaved}
        />
      )}

      <WorkoutJournalSection date={date} />
    </div>
  );
};
