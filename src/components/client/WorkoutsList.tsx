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
import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WorkoutsList = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWorkouts = async () => {
      if (!user) return;
      
      try {
        const assignedWorkouts = await fetchAssignedWorkouts(user.id);
        setWorkouts(assignedWorkouts);
      } catch (error) {
        console.error('Error loading workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkouts();
  }, [user]);

  if (isLoading) {
    return <div className="py-10 text-center">Loading workouts...</div>;
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

const CustomWorkoutsSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: customWorkouts, isLoading } = useQuery({
    queryKey: ['client-custom-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('client_custom_workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });
  
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">My Custom Workouts</h2>
        <Button onClick={() => navigate('/client-dashboard/workouts/create')} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : customWorkouts && customWorkouts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customWorkouts.map((workout) => (
            <Card key={workout.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{workout.title}</CardTitle>
                {workout.duration_minutes && (
                  <CardDescription>{workout.duration_minutes} min</CardDescription>
                )}
              </CardHeader>
              
              {workout.description && (
                <CardContent className="pb-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workout.description}
                  </p>
                </CardContent>
              )}
              
              <CardFooter className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/client-dashboard/workouts/custom/${workout.id}`)}
                >
                  View Details
                </Button>
                <Button 
                  size="sm"
                  className="bg-client hover:bg-client/90"
                  onClick={() => navigate(`/client-dashboard/workouts/custom/${workout.id}/active`)}
                >
                  Start Workout
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No Custom Workouts</CardTitle>
            <CardDescription>Create your first custom workout</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-6">
            <Button onClick={() => navigate('/client-dashboard/workouts/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Workout
            </Button>
          </CardFooter>
        </Card>
      )}
    </section>
  );
};

export default WorkoutsList;
