import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Plus, 
  Calendar, 
  Clock, 
  Users,
  Edit,
  Trash2,
  LayoutTemplate
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutWeekForm } from '@/components/coach/WorkoutWeekForm';
import { WorkoutDayForm } from '@/components/coach/WorkoutDayForm';
import { WorkoutProgramForm } from '@/components/coach/WorkoutProgramForm';
import { 
  fetchWorkoutProgram, 
  fetchWorkoutWeeks,
  createWorkoutWeek,
  updateWorkoutWeek,
  fetchWorkouts,
  createWorkout,
  deleteWorkout,
  deleteWorkoutWeek,
  deleteWorkoutProgram,
  fetchStandaloneWorkouts,
  addWorkoutToWeek,
  updateWorkoutProgram
} from '@/services/workout-service';
import { WorkoutProgram, WorkoutWeek, Workout, DAYS_OF_WEEK, StandaloneWorkout } from '@/types/workout';
import { toast } from 'sonner';
import { ScrollArea as NewScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WorkoutProgramDetailPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [weeks, setWeeks] = useState<WorkoutWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [isCreatingWeek, setIsCreatingWeek] = useState(false);
  const [isSubmittingWeek, setIsSubmittingWeek] = useState(false);
  const [isEditingWeek, setIsEditingWeek] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditingWorkout, setIsEditingWorkout] = useState<string | null>(null);
  
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [isNewWorkoutDialogOpen, setIsNewWorkoutDialogOpen] = useState(false);

  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);
  const [deleteWeekId, setDeleteWeekId] = useState<string | null>(null);
  const [isConfirmDeleteProgram, setIsConfirmDeleteProgram] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isEditingProgram, setIsEditingProgram] = useState(false);
  const [isSubmittingProgram, setIsSubmittingProgram] = useState(false);
  
  const [standaloneWorkouts, setStandaloneWorkouts] = useState<StandaloneWorkout[]>([]);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isAddingTemplateToWeek, setIsAddingTemplateToWeek] = useState<string | null>(null);
  
  const [workoutCounts, setWorkoutCounts] = useState<Record<string, number>>({});
  
  const updateWorkoutCount = async (weekId: string) => {
    try {
      const workouts = await fetchWorkouts(weekId);
      setWorkoutCounts(prev => ({
        ...prev,
        [weekId]: workouts.length
      }));
    } catch (error) {
      console.error('Error updating workout count:', error);
    }
  };

  const addWorkout = async (weekId: string, dayOfWeek: number) => {
    try {
      const newWorkout = await addWorkoutToWeek(weekId, {
        title: `Day ${dayOfWeek + 1} Workout`,
        day_of_week: dayOfWeek,
        workout_type: 'strength'
      });
      setWorkouts(prev => [...prev, newWorkout]);
      updateWorkoutCount(weekId);
    } catch (error) {
      console.error('Error adding workout:', error);
      toast.error('Failed to add workout');
    }
  };

  useEffect(() => {
    if (!programId) return;
    
    const loadProgramDetails = async () => {
      try {
        setIsLoading(true);
        
        const programData = await fetchWorkoutProgram(programId);
        setProgram(programData);
        
        const weeksData = await fetchWorkoutWeeks(programId);
        setWeeks(weeksData);
        
        const counts: Record<string, number> = {};
        for (const week of weeksData) {
          const workouts = await fetchWorkouts(week.id);
          counts[week.id] = workouts.length;
        }
        setWorkoutCounts(counts);
        
        if (weeksData.length > 0) {
          setSelectedWeek(weeksData[0].id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading program details:', error);
        toast.error('Failed to load program details');
        setIsLoading(false);
      }
    };
    
    loadProgramDetails();
  }, [programId]);
  
  useEffect(() => {
    if (selectedWeek) {
      const loadWorkouts = async () => {
        try {
          const workouts = await fetchWorkouts(selectedWeek);
          setWorkouts(workouts);
        } catch (error) {
          console.error('Error loading workouts:', error);
          toast.error('Failed to load workouts for this week');
        }
      };
      
      loadWorkouts();
    }
  }, [selectedWeek]);
  
  useEffect(() => {
    if (user?.id) {
      const loadTemplates = async () => {
        try {
          const templates = await fetchStandaloneWorkouts(user.id);
          setStandaloneWorkouts(templates);
        } catch (error) {
          console.error('Error loading workout templates:', error);
        }
      };
      
      loadTemplates();
    }
  }, [user]);
  
  const handleCreateWeek = async (values: { title: string; description?: string }) => {
    if (!programId || !user) return;
    
    try {
      setIsSubmittingWeek(true);
      
      const newWeekData = {
        program_id: programId,
        week_number: weeks.length + 1,
        title: values.title,
        description: values.description || null
      };
      
      const newWeek = await createWorkoutWeek(newWeekData);
      
      setWeeks(prev => [...prev, newWeek]);
      setSelectedWeek(newWeek.id);
      setIsCreatingWeek(false);
      
      toast.success('Week created successfully');
    } catch (error) {
      console.error('Error creating week:', error);
      toast.error('Failed to create week');
    } finally {
      setIsSubmittingWeek(false);
    }
  };
  
  const handleUpdateWeek = async (weekId: string, values: { title: string; description?: string }) => {
    if (!programId || !user) return;
    
    try {
      setIsSubmittingWeek(true);
      
      if (!values.title) {
        toast.error('Week title is required');
        return;
      }
      
      const updatedWeek = await updateWorkoutWeek(weekId, {
        title: values.title,
        description: values.description || null
      });
      
      setWeeks(prev => prev.map(week => week.id === weekId ? updatedWeek : week));
      setIsEditingWeek(null);
      
      toast.success('Week updated successfully');
    } catch (error) {
      console.error('Error updating week:', error);
      toast.error('Failed to update week');
    } finally {
      setIsSubmittingWeek(false);
    }
  };
  
  const handleSaveWorkout = async (workoutId: string) => {
    if (selectedWeek) {
      fetchWorkouts(selectedWeek).then(workouts => {
        setWorkouts(workouts);
        updateWorkoutCount(selectedWeek);
      });
      
      setOpenDialogId(null);
      setIsNewWorkoutDialogOpen(false);
      setIsEditingWorkout(null);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!deleteWorkoutId) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkout(deleteWorkoutId);
      
      if (selectedWeek) {
        const updatedWorkouts = await fetchWorkouts(selectedWeek);
        setWorkouts(updatedWorkouts);
        updateWorkoutCount(selectedWeek);
      }
      
      toast.success('Workout deleted successfully');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    } finally {
      setIsDeleting(false);
      setDeleteWorkoutId(null);
    }
  };

  const handleDeleteWeek = async () => {
    if (!deleteWeekId || !programId) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkoutWeek(deleteWeekId);
      
      const updatedWeeks = await fetchWorkoutWeeks(programId);
      setWeeks(updatedWeeks);
      
      if (deleteWeekId === selectedWeek && updatedWeeks.length > 0) {
        setSelectedWeek(updatedWeeks[0].id);
      } else if (updatedWeeks.length === 0) {
        setSelectedWeek(null);
      }
      
      toast.success('Week deleted successfully');
    } catch (error) {
      console.error('Error deleting week:', error);
      toast.error('Failed to delete week');
    } finally {
      setIsDeleting(false);
      setDeleteWeekId(null);
    }
  };

  const handleDeleteProgram = async () => {
    if (!programId) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkoutProgram(programId);
      navigate('/coach-dashboard/workouts');
      toast.success('Workout program deleted successfully');
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete workout program');
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteProgram(false);
    }
  };
  
  const handleAddTemplateToWeek = async () => {
    if (!isAddingTemplateToWeek || !selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    
    try {
      setIsAddingTemplate(true);
      
      // Default to day 0 (Sunday) if no day is selected
      const dayToUse = 0;
      
      await addWorkoutToWeek(selectedTemplate, isAddingTemplateToWeek, dayToUse);
      
      if (isAddingTemplateToWeek === selectedWeek) {
        const updatedWorkouts = await fetchWorkouts(selectedWeek);
        setWorkouts(updatedWorkouts);
      }
      
      updateWorkoutCount(isAddingTemplateToWeek);
      
      toast.success('Template workout added successfully');
      setIsAddingTemplateToWeek(null);
      setSelectedTemplate(null);
      setSelectedDay(null);
    } catch (error) {
      console.error('Error adding template workout:', error);
      toast.error('Failed to add template workout');
    } finally {
      setIsAddingTemplate(false);
    }
  };
  
  const handleUpdateProgram = async (values: { title: string; description?: string; weeks: number }) => {
    if (!programId || !program) return;
    
    try {
      setIsSubmittingProgram(true);
      
      const updatedProgram = await updateWorkoutProgram(programId, {
        title: values.title,
        description: values.description || null,
        weeks: values.weeks
      });
      
      setProgram(updatedProgram);
      setIsEditingProgram(false);
      
      toast.success('Program updated successfully');
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error('Failed to update program');
    } finally {
      setIsSubmittingProgram(false);
    }
  };
  
  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2 mt-6"></div>
            <div className="h-40 bg-muted rounded mt-6"></div>
          </div>
        </div>
      </CoachLayout>
    );
  }
  
  if (!program) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Program Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The workout program you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/coach-dashboard/workouts')}>
              Back to Programs
            </Button>
          </div>
        </div>
      </CoachLayout>
    );
  }
  
  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1" 
          onClick={() => navigate('/coach-dashboard/workouts')}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Programs
        </Button>
        
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{program.title}</h1>
              {program.description && (
                <p className="text-muted-foreground mt-1">{program.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditingProgram(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Program
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/coach-dashboard/workout-templates')}
                className="gap-2"
              >
                <LayoutTemplate className="h-4 w-4" />
                Manage Templates
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/coach-dashboard/workouts/${programId}/assign`)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Assign Program
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsConfirmDeleteProgram(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Program
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-muted px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {program.weeks} {program.weeks === 1 ? 'week' : 'weeks'}
            </span>
            <span className="bg-muted px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {new Date(program.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {weeks.length === 0 ? (
          <div className="text-center p-10 border rounded-lg bg-muted/10">
            <h3 className="font-medium text-lg mb-2">No weeks configured yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by creating the first week of your program
            </p>
            <Button 
              onClick={() => setIsCreatingWeek(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Week
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <Tabs 
                value={selectedWeek || ''} 
                onValueChange={setSelectedWeek}
                className="w-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Program Schedule</h2>
                  <Dialog open={isCreatingWeek} onOpenChange={setIsCreatingWeek}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        Add Week
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Week</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <WorkoutWeekForm
                          weekNumber={weeks.length + 1}
                          onSubmit={handleCreateWeek}
                          isSubmitting={isSubmittingWeek}
                          onCancel={() => setIsCreatingWeek(false)}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-6">
                  {weeks.map((week) => (
                    <TabsTrigger key={week.id} value={week.id}>
                      Week {week.week_number} ({workoutCounts[week.id] || 0})
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <NewScrollArea className="h-[calc(100vh-25rem)]">
                  {weeks.map((week) => (
                    <TabsContent key={week.id} value={week.id}>
                      <div className="mb-4 flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{week.title}</h3>
                          {week.description && (
                            <p className="text-muted-foreground text-sm mt-1">{week.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingWeek(week.id)}
                            className="gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Week
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteWeekId(week.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Week
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mb-4 gap-2">
                        <Dialog 
                          open={isAddingTemplateToWeek === week.id} 
                          onOpenChange={(open) => {
                            if (open) {
                              setIsAddingTemplateToWeek(week.id);
                            } else {
                              setIsAddingTemplateToWeek(null);
                              setSelectedTemplate(null);
                              setSelectedDay(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              disabled={standaloneWorkouts.length === 0}
                            >
                              <LayoutTemplate className="h-4 w-4" />
                              Add from Templates
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Template Workout</DialogTitle>
                              <DialogDescription>
                                Select a workout template to add to this week
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <h4 className="font-medium">Template Workout</h4>
                                <Select 
                                  value={selectedTemplate || ''} 
                                  onValueChange={setSelectedTemplate}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {standaloneWorkouts.map(template => (
                                      <SelectItem key={template.id} value={template.id}>
                                        {template.title}
                                        {template.category ? ` (${template.category})` : ''}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={handleAddTemplateToWeek}
                                disabled={!selectedTemplate || isAddingTemplate}
                              >
                                {isAddingTemplate ? 'Adding...' : 'Add Template Workout'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      
                        <Dialog 
                          open={isNewWorkoutDialogOpen && selectedWeek === week.id} 
                          onOpenChange={(open) => setIsNewWorkoutDialogOpen(open)}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Custom Workout
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Create New Workout</DialogTitle>
                              <DialogDescription>
                                Add a new workout to this week with custom exercises.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <WorkoutDayForm
                                weekId={week.id}
                                onSave={handleSaveWorkout}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {workouts.length === 0 ? (
                        <div className="text-center py-10 border rounded-lg">
                          <h3 className="font-medium mb-2">No workouts added yet</h3>
                          <p className="text-muted-foreground mb-6">
                            Add workouts to create your training plan for this week
                          </p>
                          <Button 
                            onClick={() => setIsNewWorkoutDialogOpen(true)}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add First Workout
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {workouts.map((workout) => (
                            <Card key={workout.id}>
                              <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg truncate" title={workout.title}>
                                  {workout.title}
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                  <Dialog
                                    open={isEditingWorkout === workout.id}
                                    onOpenChange={(open) => {
                                      if (!open) setIsEditingWorkout(null);
                                      else setIsEditingWorkout(workout.id);
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">Edit workout</span>
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl">
                                      <DialogHeader>
                                        <DialogTitle>Edit Workout</DialogTitle>
                                      </DialogHeader>
                                      <div className="mt-4">
                                        <WorkoutDayForm
                                          weekId={week.id}
                                          workoutId={workout.id}
                                          onSave={handleSaveWorkout}
                                          mode="edit"
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteWorkoutId(workout.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete workout</span>
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {workout.description && (
                                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {workout.description}
                                  </p>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => setIsEditingWorkout(workout.id)}
                                >
                                  View & Edit
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </NewScrollArea>
              </Tabs>
            </div>
          </div>
        )}
        
        <Dialog open={isCreatingWeek} onOpenChange={setIsCreatingWeek}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create First Week</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <WorkoutWeekForm
                weekNumber={1}
                onSubmit={handleCreateWeek}
                isSubmitting={isSubmittingWeek}
                onCancel={() => setIsCreatingWeek(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
        
        {isEditingWeek && weeks.find(week => week.id === isEditingWeek) && (
          <Dialog open={!!isEditingWeek} onOpenChange={(open) => !open && setIsEditingWeek(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Week</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <WorkoutWeekForm
                  weekNumber={weeks.find(week => week.id === isEditingWeek)?.week_number || 1}
                  initialData={weeks.find(week => week.id === isEditingWeek)}
                  onSubmit={(values) => {
                    if (!values.title) {
                      toast.error('Week title is required');
                      return;
                    }
                    handleUpdateWeek(isEditingWeek, values);
                  }}
                  isSubmitting={isSubmittingWeek}
                  onCancel={() => setIsEditingWeek(null)}
                  mode="edit"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog 
          open={isEditingProgram} 
          onOpenChange={setIsEditingProgram}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Program</DialogTitle>
              <DialogDescription>
                Update the program details. Note that changing the number of weeks is disabled to preserve program integrity.
              </DialogDescription>
            </DialogHeader>
            <WorkoutProgramForm
              onSubmit={handleUpdateProgram}
              isSubmitting={isSubmittingProgram}
              initialData={program}
              mode="edit"
              onCancel={() => setIsEditingProgram(false)}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog 
          open={deleteWorkoutId !== null}
          onOpenChange={(open) => !open && setDeleteWorkoutId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workout? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteWorkout}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog 
          open={deleteWeekId !== null}
          onOpenChange={(open) => !open && setDeleteWeekId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Week</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this week and all its workouts? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteWeek}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog 
          open={isConfirmDeleteProgram}
          onOpenChange={setIsConfirmDeleteProgram}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout Program</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this entire workout program including all weeks and workouts? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProgram}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CoachLayout>
  );
};

export default WorkoutProgramDetailPage;
