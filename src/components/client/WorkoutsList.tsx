
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, CheckCircle2, Timer, Flame, PlusCircle, Trash2 } from 'lucide-react';
import { format, isPast, isToday, isFuture } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { deleteWorkoutCompletion } from '@/services/workout-edit-service';
import { toast } from 'sonner';

const WorkoutsList = () => {
  const { user } = useAuth();
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [pastWorkouts, setPastWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<WorkoutHistoryItem[]>([]);
  
  const { data: assignedWorkouts, isLoading, error, refetch } = useQuery({
    queryKey: ['assigned-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await fetchAssignedWorkouts(user.id);
    },
    enabled: !!user?.id,
  });
  
  useEffect(() => {
    if (assignedWorkouts) {
      const today = new Date();
      
      const upcoming = assignedWorkouts.filter(workout => {
        if (!workout.workout?.day_of_week) return false;
        const workoutDate = workout.workout?.week?.week_number ? 
          new Date(today.getFullYear(), today.getMonth(), today.getDate() + (workout.workout.day_of_week - today.getDay())) :
          today;
        return !workout.completed_at && (isToday(workoutDate) || isFuture(workoutDate));
      });
      
      const past = assignedWorkouts.filter(workout => {
        if (!workout.workout?.day_of_week) return false;
        const workoutDate = workout.workout?.week?.week_number ?
          new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() - workout.workout.day_of_week)) :
          today;
        return !workout.completed_at && isPast(workoutDate) && !isToday(workoutDate);
      });
      
      const completed = assignedWorkouts.filter(workout => workout.completed_at);
      
      setUpcomingWorkouts(upcoming);
      setPastWorkouts(past);
      setCompletedWorkouts(completed);
    }
  }, [assignedWorkouts]);
  
  if (error) {
    console.error("Error fetching assigned workouts:", error);
  }

  const handleUndoWorkoutCompletion = async (workoutId: string) => {
    try {
      const success = await deleteWorkoutCompletion(workoutId);
      if (success) {
        toast.success("Workout completion removed");
        // Trigger refetch of workout data
        document.getElementById('refresh-workout-history')?.click();
        // Need to refetch assigned workouts as well
        await refetch();
      } else {
        toast.error("Failed to remove workout completion");
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("An error occurred while removing the workout");
    }
  };
  
  return (
    <div>
      <div className="mt-6 mb-2 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-1 flex items-center justify-center gap-2">
          <CalendarDays className="h-5 w-5 text-client" />
          Today's Workout
        </h2>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-6">
          Loading workouts...
        </div>
      ) : upcomingWorkouts.length > 0 ? (
        <div className="space-y-4">
          {upcomingWorkouts.map(workout => (
            <Card key={workout.id} className="border-emerald-300 border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-emerald-500" />
                  {workout.workout?.title || 'Today\'s Workout'}
                </CardTitle>
                <CardDescription>
                  {workout.workout?.description || 'Get ready to sweat!'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  {/* Default to 30 minutes if no duration is specified */}
                  30 minutes
                </div>
              </CardContent>
              <div className="p-4 border-t">
                <Button asChild className="w-full">
                  <Link to={`/client-dashboard/workouts/active/${workout.id}`}>
                    Start Workout
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 flex flex-col items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">No workouts scheduled for today!</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Enjoy a rest day or explore other activities.
            </p>
            
            <Button asChild variant="outline" className="mt-4">
              <Link to="/client-dashboard/workouts/one-off">
                <PlusCircle className="h-4 w-4 mr-2" />
                Log a Custom Workout
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      
      {pastWorkouts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Past Workouts</h3>
          <div className="space-y-3">
            {pastWorkouts.map(workout => {
              const dayOfWeek = workout.workout?.day_of_week || 1;
              const today = new Date();
              const workoutDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() - (today.getDay() - dayOfWeek)
              );
              
              return (
                <Card key={workout.id}>
                  <CardHeader>
                    <CardTitle>{workout.workout?.title || 'Workout'}</CardTitle>
                    <CardDescription>
                      {format(workoutDate, 'PPP')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Complete this workout to continue your program.
                    </p>
                  </CardContent>
                  <div className="p-4 border-t">
                    <Button asChild className="w-full">
                      <Link to={`/client-dashboard/workouts/active/${workout.id}`}>
                        Start Workout
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {completedWorkouts.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Recently Completed Workouts</h3>
          <div className="space-y-3">
            {completedWorkouts.map(workout => (
              <div key={workout.id} className="border rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{workout.title || workout.workout?.title || 'Workout'}</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Completed on {format(new Date(workout.completed_at!), 'PPP')}
                    </p>
                    {workout.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Notes: {workout.notes}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUndoWorkoutCompletion(workout.id)}
                    title="Undo completion"
                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutsList;
