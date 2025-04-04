
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Dumbbell, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCustomWorkouts, CustomWorkout } from '@/services/client-custom-workout-service';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from 'date-fns';

const CustomWorkoutsList = () => {
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});

  const toggleWorkoutDetails = (workoutId: string) => {
    setExpandedWorkouts(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId]
    }));
  };

  useEffect(() => {
    const loadCustomWorkouts = async () => {
      try {
        const data = await fetchCustomWorkouts();
        // Sort workouts by workout_date (if available) or created_at date
        const sortedWorkouts = data.sort((a, b) => {
          const dateA = a.workout_date ? new Date(a.workout_date) : new Date(a.created_at);
          const dateB = b.workout_date ? new Date(b.workout_date) : new Date(b.created_at);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });
        setCustomWorkouts(sortedWorkouts);
      } catch (error) {
        console.error('Error loading custom workouts:', error);
        toast.error('Failed to load your custom workouts');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomWorkouts();
  }, []);

  // Function to get day of week label from date
  const getDayOfWeek = (dateString: string | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return format(date, 'EEE'); // Returns 3-letter day name (Mon, Tue, etc.)
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Custom Workouts</h2>
        <Button asChild size="sm" className="h-8">
          <Link to="/client-dashboard/workouts/create">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create Workout
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <p className="text-muted-foreground">Loading custom workouts...</p>
        </div>
      ) : customWorkouts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1.5">No custom workouts yet</h3>
            <p className="text-xs text-muted-foreground mb-3 max-w-md mx-auto">
              Create your own workouts to track exercises not included in your assigned programs.
            </p>
            <Button asChild size="sm">
              <Link to="/client-dashboard/workouts/create">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Your First Workout
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customWorkouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader className="px-4 py-3 pb-2">
                {workout.workout_date && (
                  <div className="flex items-center mb-1">
                    <div className="bg-muted w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      {getDayOfWeek(workout.workout_date)}
                    </div>
                    <CardTitle className="text-lg">{workout.title}</CardTitle>
                  </div>
                )}
                {!workout.workout_date && (
                  <CardTitle className="text-lg">{workout.title}</CardTitle>
                )}
                {workout.duration_minutes && (
                  <CardDescription className="text-xs">
                    Duration: {workout.duration_minutes} minutes
                  </CardDescription>
                )}
              </CardHeader>
              
              <Collapsible 
                open={expandedWorkouts[workout.id] || false}
                onOpenChange={() => toggleWorkoutDetails(workout.id)}
              >
                <CardContent className="pb-0 px-4 pt-0">
                  <div className="flex justify-end -mt-1 mb-0">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        {expandedWorkouts[workout.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle details</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent className="space-y-2 pb-2">
                    {workout.description && (
                      <div>
                        <h4 className="text-xs font-medium">Description</h4>
                        <p className="text-xs text-muted-foreground">{workout.description}</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </CardContent>
              </Collapsible>
              
              <CardFooter className="p-3">
                <Button variant="outline" size="sm" className="w-full h-9 py-1" asChild>
                  <Link to={`/client-dashboard/workouts/custom/${workout.id}`}>
                    <Eye className="h-4 w-4 mr-1.5" />
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
