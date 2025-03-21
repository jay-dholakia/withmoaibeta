
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCurrentProgram, fetchOngoingWorkout } from '@/services/client-service';
import { DAYS_OF_WEEK } from '@/types/workout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Play, Dumbbell, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const WorkoutsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { 
    data: currentProgram, 
    isLoading: isProgramLoading, 
    error: programError,
    refetch: refetchProgram 
  } = useQuery({
    queryKey: ['client-current-program', user?.id],
    queryFn: () => fetchCurrentProgram(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  });

  console.log("Current program data:", currentProgram);
  if (programError) {
    console.error("Error loading program:", programError);
  }

  const { data: ongoingWorkout, isLoading: isOngoingLoading, error: ongoingError } = useQuery({
    queryKey: ['client-ongoing-workout', user?.id],
    queryFn: () => fetchOngoingWorkout(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (ongoingError) {
    console.error("Error loading ongoing workout:", ongoingError);
  }

  const startWorkout = async (workoutId: string) => {
    try {
      const { startWorkout } = await import('@/services/client-service');
      const workoutCompletionId = await startWorkout(user?.id || '', workoutId);
      navigate(`/client-dashboard/workouts/active/${workoutCompletionId}`);
      toast.success('Workout started!');
    } catch (error) {
      console.error('Error starting workout:', error);
      toast.error('Failed to start workout');
    }
  };

  const resumeWorkout = (workoutCompletionId: string) => {
    navigate(`/client-dashboard/workouts/active/${workoutCompletionId}`);
  };

  const handleRefresh = () => {
    refetchProgram();
    toast.info('Refreshing program data...');
  };

  if (isProgramLoading || isOngoingLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }

  // Show ongoing workout if available
  if (ongoingWorkout) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Continue Your Workout</h1>
        
        <Card className="border-client/20">
          <CardHeader className="bg-client/5">
            <CardTitle>{ongoingWorkout.workout.title}</CardTitle>
            <CardDescription>
              You have an ongoing workout session
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Started {new Date(ongoingWorkout.completed_at).toLocaleString()}
              </p>
              <p className="font-medium">
                {ongoingWorkout.workout.workout_exercises.length} exercises
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4">
            <Button
              onClick={() => resumeWorkout(ongoingWorkout.id)}
              className="bg-client hover:bg-client/90"
            >
              <Play className="mr-2 h-4 w-4" /> Continue Workout
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if we have program data
  if (!currentProgram || !currentProgram.program) {
    console.log("No active program found for user:", user?.id);
    
    return (
      <div className="text-center py-12">
        <Dumbbell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-medium mb-2">No Active Program</h2>
        <p className="text-muted-foreground mb-6">
          You don't have an active workout program assigned yet.
        </p>
        <div className="flex flex-col space-y-3 items-center">
          <div className="flex flex-col items-center p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 max-w-md mb-4">
            <AlertCircle className="h-5 w-5 mb-2" />
            <p className="text-sm text-center">
              If your coach has recently assigned you a program, please click the refresh button below.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            User ID: {user?.id || 'Not logged in'}
          </p>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  console.log("Program found:", currentProgram.program.title);
  
  const program = currentProgram.program;
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentWeekNumber = getCurrentWeekNumber(currentProgram.start_date);
  
  console.log("Current week number:", currentWeekNumber);
  
  // Find current week - ensure weeks exists and is an array
  const weeks = Array.isArray(program.weeks) ? program.weeks : [];
  const currentWeek = weeks.find((week: any) => week.week_number === currentWeekNumber);
  
  console.log("Current week:", currentWeek);
  console.log("Workouts in week:", currentWeek?.workouts);
  
  // Handle case where there are no workouts this week
  if (!currentWeek || !currentWeek.workouts || !Array.isArray(currentWeek.workouts) || currentWeek.workouts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{program.title}</h1>
          <p className="text-muted-foreground">
            Week {currentWeekNumber} of {weeks.length}
          </p>
        </div>
        
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">
            {!currentWeek ? "Program Week Not Found" : "No Workouts This Week"}
          </h2>
          <p className="text-muted-foreground">
            {!currentWeek 
              ? `Week ${currentWeekNumber} is not defined in this program.` 
              : "There are no workouts scheduled for this week."}
          </p>
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{program.title}</h1>
          <p className="text-muted-foreground">
            Week {currentWeekNumber} of {weeks.length}
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4">
        {currentWeek.workouts.map((workout: any) => (
          <Card 
            key={workout.id} 
            className={workout.day_of_week === today ? "border-client" : ""}
          >
            <CardHeader className={workout.day_of_week === today ? "bg-client/5" : ""}>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{workout.title}</CardTitle>
                  <CardDescription>
                    {DAYS_OF_WEEK[workout.day_of_week]}
                  </CardDescription>
                </div>
                {workout.day_of_week === today && (
                  <div className="text-xs font-medium text-client bg-client/10 px-2 py-1 rounded">
                    Today
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm mb-4">{workout.description || 'Complete all exercises in this workout'}</p>
              <div className="flex gap-1 flex-wrap">
                {workout.workout_exercises && Array.isArray(workout.workout_exercises) && workout.workout_exercises.map((exercise: any, index: number) => (
                  <div 
                    key={exercise.id}
                    className="text-xs bg-muted px-2 py-1 rounded"
                  >
                    {exercise.exercise?.name || 'Unknown exercise'}
                    {index < workout.workout_exercises.length - 1 ? ', ' : ''}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button
                onClick={() => startWorkout(workout.id)}
                variant={workout.day_of_week === today ? "default" : "outline"}
                className={workout.day_of_week === today ? "bg-client hover:bg-client/90" : ""}
              >
                <Play className="mr-2 h-4 w-4" /> Start Workout
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Helper function to calculate current week number
const getCurrentWeekNumber = (startDateString: string): number => {
  const startDate = new Date(startDateString);
  const today = new Date();
  
  // Calculate difference in milliseconds
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate week number (starting at 1)
  return Math.floor(diffDays / 7) + 1;
};

export default WorkoutsList;
