
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Plus, Clock, Calendar, Dumbbell, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchWorkoutWeek,
  fetchWorkoutsForWeek, 
  fetchWorkoutProgram 
} from '@/services/workout-service';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditWeekMetricsForm } from '@/components/coach/EditWeekMetricsForm';

const WorkoutWeekDetailPage = () => {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  
  // Fetch week details
  const { 
    data: weekData, 
    isLoading: isLoadingWeek,
    error: weekError,
    refetch: refetchWeekData
  } = useQuery({
    queryKey: ['workout-week', weekId],
    queryFn: () => weekId ? fetchWorkoutWeek(weekId) : null,
    enabled: !!weekId
  });
  
  // Fetch workouts for this week
  const { 
    data: workouts, 
    isLoading: isLoadingWorkouts,
    error: workoutsError
  } = useQuery({
    queryKey: ['workouts-for-week', weekId],
    queryFn: () => weekId ? fetchWorkoutsForWeek(weekId) : [],
    enabled: !!weekId
  });
  
  // Fetch program details once we have the week data
  const { 
    data: programData,
    isLoading: isLoadingProgram 
  } = useQuery({
    queryKey: ['workout-program', weekData?.program_id],
    queryFn: () => weekData?.program_id ? fetchWorkoutProgram(weekData.program_id) : null,
    enabled: !!weekData?.program_id
  });

  const isLoading = isLoadingWeek || isLoadingWorkouts || isLoadingProgram;
  
  // Handle any errors
  useEffect(() => {
    if (weekError) {
      toast.error("Failed to load week details");
      console.error("Error loading week details:", weekError);
    }
    
    if (workoutsError) {
      toast.error("Failed to load workouts");
      console.error("Error loading workouts:", workoutsError);
    }
  }, [weekError, workoutsError]);

  // Handler for when metrics are updated
  const handleMetricsUpdated = () => {
    setShowMetricsDialog(false);
    refetchWeekData();
    toast.success("Weekly metrics updated successfully");
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p>Loading workout details...</p>
          </div>
        </div>
      </CoachLayout>
    );
  }
  
  if (!weekData) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center p-10">
            <h2 className="text-xl font-medium mb-2">Week not found</h2>
            <p className="text-muted-foreground mb-6">
              The workout week you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/coach-dashboard/workouts')}>
              Back to Programs
            </Button>
          </div>
        </div>
      </CoachLayout>
    );
  }

  const handleAddWorkout = () => {
    // Navigate to add workout form
    toast.info("Add workout functionality coming soon!");
    // This would typically navigate to a form for adding a workout to this week
    // navigate(`/coach-dashboard/workouts/week/${weekId}/add-workout`);
  };

  const handleEditWeekDetails = () => {
    toast.info("Edit week details functionality coming soon!");
    // This would typically navigate to a form for editing the week details
    // navigate(`/coach-dashboard/workouts/week/${weekId}/edit`);
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const isProgramTypeRun = programData?.program_type === 'run';
  const ProgramTypeIcon = isProgramTypeRun ? '🏃' : <Dumbbell className="h-3.5 w-3.5" />;

  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Navigation and header */}
          <div>
            <Button
              variant="outline"
              size="sm"
              className="mb-4"
              onClick={() => programData ? navigate(`/coach-dashboard/workouts/${programData.id}`) : navigate('/coach-dashboard/workouts')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to {programData ? programData.title : 'Programs'}
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {weekData.title || `Week ${weekData.week_number}`}
                  </h1>
                  {programData && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {typeof ProgramTypeIcon === 'string' ? (
                        <span className="mr-1">{ProgramTypeIcon}</span>
                      ) : (
                        ProgramTypeIcon
                      )}
                      <span>Moai {isProgramTypeRun ? 'Run' : 'Strength'}</span>
                    </Badge>
                  )}
                </div>
                {weekData.description && (
                  <p className="text-muted-foreground mt-1">{weekData.description}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEditWeekDetails}>
                  Edit Week Details
                </Button>
                <Button size="sm" onClick={handleAddWorkout}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workout
                </Button>
              </div>
            </div>
          </div>
          
          {/* Program context */}
          {programData && (
            <div className="p-4 border rounded-md bg-muted/30">
              <p className="text-sm flex items-center gap-2">
                <span className="font-medium">Program:</span> 
                <span>{programData.title}</span>
                <span className="text-muted-foreground">•</span> 
                <span className="font-medium">Week:</span> 
                <span>{weekData.week_number} of {programData.weeks}</span>
              </p>
            </div>
          )}
          
          {/* Weekly metrics (program-type specific) */}
          {programData && (
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                {isProgramTypeRun ? (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <span role="img" aria-label="running">🏃</span>
                          Target Miles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{weekData.target_miles_run || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Target Cardio Minutes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{weekData.target_cardio_minutes || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Dumbbell className="h-4 w-4" />
                          Strength Workouts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{weekData.target_strength_mobility_workouts || 0}</p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Dumbbell className="h-4 w-4" />
                          Strength Workouts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{weekData.target_strength_workouts || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Target Cardio Minutes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{weekData.target_cardio_minutes || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Mobility Workouts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{weekData.target_strength_mobility_workouts || 0}</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
              
              {/* Edit metrics button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-0 right-0"
                onClick={() => setShowMetricsDialog(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Metrics
              </Button>
            </div>
          )}
          
          {/* Workouts list */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Workouts</h2>
            
            {workouts && workouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workouts.map((workout) => (
                  <Card key={workout.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>{workout.title}</span>
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {workout.day_of_week !== null && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {dayNames[workout.day_of_week]}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {workout.description && (
                        <p className="text-sm mb-4">{workout.description}</p>
                      )}
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast.info("View workout details functionality coming soon!");
                            // navigate(`/coach-dashboard/workouts/week/${weekId}/workout/${workout.id}`);
                          }}
                        >
                          <Dumbbell className="h-4 w-4 mr-2" />
                          View Exercises
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-md bg-muted/10">
                <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No workouts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first workout to this week to get started.
                </p>
                <Button onClick={handleAddWorkout}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Metrics Dialog */}
      <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Weekly Metrics</DialogTitle>
          </DialogHeader>
          {weekData && programData && (
            <EditWeekMetricsForm 
              weekId={weekId || ''} 
              initialData={weekData}
              programType={programData.program_type || 'strength'} 
              onSuccess={handleMetricsUpdated}
            />
          )}
        </DialogContent>
      </Dialog>
    </CoachLayout>
  );
};

export default WorkoutWeekDetailPage;
