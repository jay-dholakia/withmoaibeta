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
  Edit
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutWeekForm } from '@/components/coach/WorkoutWeekForm';
import { WorkoutDayForm } from '@/components/coach/WorkoutDayForm';
import { 
  fetchWorkoutProgram, 
  fetchWorkoutWeeks,
  createWorkoutWeek,
  fetchWorkouts,
  createWorkout
} from '@/services/workout-service';
import { WorkoutProgram, WorkoutWeek, Workout, DAYS_OF_WEEK } from '@/types/workout';
import { toast } from 'sonner';

const WorkoutProgramDetailPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [weeks, setWeeks] = useState<WorkoutWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [isCreatingWeek, setIsCreatingWeek] = useState(false);
  const [isSubmittingWeek, setIsSubmittingWeek] = useState(false);
  const [workoutsByDay, setWorkoutsByDay] = useState<Record<number, Workout>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [configuredDays, setConfiguredDays] = useState<{ [key: string]: string }>({});
  
  useEffect(() => {
    if (!programId) return;
    
    const loadProgramDetails = async () => {
      try {
        setIsLoading(true);
        
        const programData = await fetchWorkoutProgram(programId);
        setProgram(programData);
        
        const weeksData = await fetchWorkoutWeeks(programId);
        setWeeks(weeksData);
        
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
          
          const byDay: Record<number, Workout> = {};
          const configuredDaysMap: { [key: string]: string } = {};
          
          workouts.forEach(workout => {
            byDay[workout.day_of_week] = workout;
            configuredDaysMap[`${selectedWeek}-${workout.day_of_week}`] = workout.id;
          });
          
          setWorkoutsByDay(byDay);
          setConfiguredDays(prev => ({...prev, ...configuredDaysMap}));
        } catch (error) {
          console.error('Error loading workouts:', error);
          toast.error('Failed to load workouts for this week');
        }
      };
      
      loadWorkouts();
    }
  }, [selectedWeek]);
  
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
  
  const handleSaveWorkout = async (values: any, dayIndex: number) => {
    if (!selectedWeek) return;
    
    try {
      const workout = await createWorkout({
        week_id: selectedWeek,
        day_of_week: dayIndex,
        title: values.title,
        description: values.description || null
      });
      
      setConfiguredDays(prev => ({
        ...prev,
        [`${selectedWeek}-${dayIndex}`]: workout.id
      }));
      
      toast.success(`Workout saved for ${DAYS_OF_WEEK[dayIndex]}`);
      
      return workout.id;
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to save workout');
      return null;
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
            <Button 
              variant="outline" 
              onClick={() => navigate(`/coach-dashboard/workouts/${programId}/assign`)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Assign Program
            </Button>
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
                      Week {week.week_number}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {weeks.map((week) => (
                  <TabsContent key={week.id} value={week.id}>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">{week.title}</h3>
                      {week.description && (
                        <p className="text-muted-foreground text-sm mt-1">{week.description}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {DAYS_OF_WEEK.map((day, index) => {
                        const dayConfigKey = `${selectedWeek}-${index}`;
                        const hasWorkout = dayConfigKey in configuredDays;
                        const workoutId = configuredDays[dayConfigKey];
                        
                        if (hasWorkout) {
                          return (
                            <Card key={index}>
                              <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">{day}</CardTitle>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit {day} workout</span>
                                </Button>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">
                                  Workout configured
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mt-4 w-full"
                                  onClick={() => navigate(`/coach-dashboard/workouts/${programId}/weeks/${week.id}/days/${index}`)}
                                >
                                  View Workout
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        }
                        
                        return (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle className="text-lg">{day}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-full gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Workout
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Configure {day} Workout</DialogTitle>
                                    <DialogDescription>
                                      Add exercises and details for the {day.toLowerCase()} workout.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    <WorkoutDayForm
                                      dayName={day}
                                      dayNumber={index}
                                      weekId={week.id}
                                      onSave={(workoutId) => handleSaveWorkout({}, index)}
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
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
      </div>
    </CoachLayout>
  );
};

export default WorkoutProgramDetailPage;
