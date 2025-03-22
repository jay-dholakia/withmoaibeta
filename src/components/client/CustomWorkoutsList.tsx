
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCustomWorkouts, CustomWorkout } from '@/services/client-custom-workout-service';
import { toast } from 'sonner';

const CustomWorkoutsList = () => {
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomWorkouts = async () => {
      try {
        const data = await fetchCustomWorkouts();
        setCustomWorkouts(data);
      } catch (error) {
        console.error('Error loading custom workouts:', error);
        toast.error('Failed to load your custom workouts');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomWorkouts();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Custom Workouts</h2>
        <Button asChild>
          <Link to="/client-dashboard/workouts/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Workout
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <p className="text-muted-foreground">Loading custom workouts...</p>
        </div>
      ) : customWorkouts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Dumbbell className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No custom workouts yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Create your own workouts to track exercises not included in your assigned programs.
            </p>
            <Button asChild>
              <Link to="/client-dashboard/workouts/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workout
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customWorkouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader className="pb-3">
                <CardTitle>{workout.title}</CardTitle>
                {workout.duration_minutes && (
                  <CardDescription>
                    Duration: {workout.duration_minutes} minutes
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {workout.description && <p className="text-sm">{workout.description}</p>}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/client-dashboard/workouts/custom/${workout.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomWorkoutsList;
