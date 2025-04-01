
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCustomWorkouts, CustomWorkout } from '@/services/client-custom-workout-service';
import { Clock, Calendar, Activity, Plus } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';

const WorkoutsList = () => {
  const { user } = useAuth();
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        setIsLoading(true);
        const workouts = await fetchCustomWorkouts();
        setCustomWorkouts(workouts);
      } catch (error) {
        console.error('Error loading custom workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadWorkouts();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="assigned" className="flex-1">Assigned Workouts</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">Custom Workouts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assigned">
          <div className="text-center p-8 bg-muted/30 rounded-lg">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Assigned Workouts</h2>
            <p className="text-muted-foreground mb-4">
              You don't have any workouts assigned yet. Create your own custom workouts or check back later.
            </p>
            <Button asChild>
              <Link to="/client-dashboard/workouts/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Workout
              </Link>
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="custom">
          {isLoading ? (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your custom workouts...</p>
            </div>
          ) : customWorkouts.length === 0 ? (
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Custom Workouts</h2>
              <p className="text-muted-foreground mb-4">
                You haven't created any custom workouts yet. Get started by creating your first one!
              </p>
              <Button asChild>
                <Link to="/client-dashboard/workouts/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Workout
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {customWorkouts.map((workout) => (
                <Card key={workout.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <Link 
                      to={`/client-dashboard/workouts/custom/${workout.id}`}
                      className="block"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center mb-1">
                            <WorkoutTypeIcon type={workout.workout_type as any || 'custom'} size="sm" />
                            <h3 className="text-lg font-medium ml-1">{workout.title}</h3>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            {workout.duration_minutes && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{workout.duration_minutes} min</span>
                              </div>
                            )}
                            
                            {workout.workout_date && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{new Date(workout.workout_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <span className="text-xs opacity-70">
                                Created {formatDistance(new Date(workout.created_at), new Date(), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="icon" className="rounded-full -mt-1 -mr-2">
                          <span className="sr-only">View details</span>
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                          >
                            <path
                              d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                              fill="currentColor"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </Button>
                      </div>
                      
                      {workout.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {workout.description}
                        </p>
                      )}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Button asChild>
              <Link to="/client-dashboard/workouts/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New Workout
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutsList;
