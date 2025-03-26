
import React, { useEffect, useState } from 'react';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { DAYS_OF_WEEK } from '@/types/workout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import CustomWorkoutsList from './CustomWorkoutsList';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const WorkoutsList = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkouts = async () => {
      if (!user || !user.id) {
        console.error("Cannot load workouts: User or user ID is missing", user);
        setError('User not authenticated properly. Please try logging in again.');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Loading assigned workouts for user:", user.id);
        setIsLoading(true);
        setError(null);
        
        const assignedWorkouts = await fetchAssignedWorkouts(user.id);
        console.log("Assigned workouts loaded:", assignedWorkouts.length);
        setWorkouts(assignedWorkouts);
      } catch (error) {
        console.error('Error loading workouts:', error);
        setError('Failed to load your assigned workouts');
        toast.error('There was a problem loading your workouts');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkouts();
  }, [user]);

  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-client" />
        <p>Loading your workouts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="assigned" className="flex-1">Assigned Workouts</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">Custom Workouts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assigned" className="pt-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Assigned Workouts</h2>
            
            {workouts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-muted-foreground">
                    You don't have any assigned workouts yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workouts.map((workout) => (
                  <Card key={workout.id}>
                    <CardHeader>
                      <CardTitle>
                        {workout.workout?.title || 'Untitled Workout'}
                      </CardTitle>
                      {workout.workout?.day_of_week !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          {DAYS_OF_WEEK[workout.workout.day_of_week]}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {workout.workout?.description && (
                        <p className="text-muted-foreground">
                          {workout.workout.description}
                        </p>
                      )}
                      <div className="mt-2">
                        {workout.workout?.week && (
                          <div className="text-sm">
                            <span className="font-medium">Week:</span>{' '}
                            {workout.workout.week.week_number}
                          </div>
                        )}
                        {workout.workout?.week?.program && (
                          <div className="text-sm">
                            <span className="font-medium">Program:</span>{' '}
                            {workout.workout.week.program.title}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/client-dashboard/workouts/active/${workout.id}`}>
                          Start Workout
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="pt-4">
          <CustomWorkoutsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutsList;
