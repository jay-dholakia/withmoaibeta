
import React, { useEffect, useState } from 'react';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import CustomWorkoutsList from './CustomWorkoutsList';
import { Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { fetchCurrentProgram } from '@/services/program-service';

const WorkoutsList = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [availableWeeks, setAvailableWeeks] = useState<{number: number, programTitle: string}[]>([]);
  const [currentProgram, setCurrentProgram] = useState<any | null>(null);

  useEffect(() => {
    const loadWorkoutsAndProgram = async () => {
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
        
        // Load current program in parallel with assigned workouts
        const programPromise = fetchCurrentProgram(user.id);
        const workoutsPromise = fetchAssignedWorkouts(user.id);
        
        const [program, assignedWorkouts] = await Promise.all([programPromise, workoutsPromise]);
        
        console.log("Current program loaded:", program);
        console.log("Assigned workouts loaded:", assignedWorkouts.length);
        
        setCurrentProgram(program);
        setWorkouts(assignedWorkouts);
        
        // Extract unique weeks for filtering
        const weeks = new Map<string, {number: number, programTitle: string}>();
        assignedWorkouts.forEach(workout => {
          if (workout.workout?.week) {
            const key = `${workout.workout.week.week_number}-${workout.workout.week.program?.title || 'Unknown'}`;
            if (!weeks.has(key)) {
              weeks.set(key, {
                number: workout.workout.week.week_number,
                programTitle: workout.workout.week.program?.title || 'Unknown Program'
              });
            }
          }
        });
        
        const extractedWeeks = Array.from(weeks.values());
        setAvailableWeeks(extractedWeeks);
        
        // Set default filter to the current week if available
        if (extractedWeeks.length > 0) {
          // Sort weeks by number (ascending)
          const sortedWeeks = [...extractedWeeks].sort((a, b) => a.number - b.number);
          
          // Find current week or closest week to current
          const currentWeekValue = `${sortedWeeks[0].number}-${sortedWeeks[0].programTitle}`;
          setWeekFilter(currentWeekValue);
        }
      } catch (error) {
        console.error('Error loading workouts:', error);
        setError('Failed to load your assigned workouts');
        toast.error('There was a problem loading your workouts');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkoutsAndProgram();
  }, [user]);

  const filteredWorkouts = React.useMemo(() => {
    if (weekFilter === "all") {
      return workouts;
    }
    
    const [weekNumber, programTitle] = weekFilter.split('-');
    return workouts.filter(workout => {
      return workout.workout?.week && 
             workout.workout.week.week_number === parseInt(weekNumber) && 
             (programTitle === "any" || 
              workout.workout.week.program?.title === programTitle);
    });
  }, [workouts, weekFilter]);

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
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {currentProgram && currentProgram.program ? (
                  <>
                    <h2 className="text-xl font-semibold">{currentProgram.program.title}</h2>
                    {currentProgram.program.description && (
                      <p className="text-sm text-muted-foreground">{currentProgram.program.description}</p>
                    )}
                  </>
                ) : (
                  <h2 className="text-xl font-semibold">Your Assigned Workouts</h2>
                )}
              </div>
              
              {availableWeeks.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    value={weekFilter}
                    onValueChange={setWeekFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by week" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Weeks</SelectItem>
                      {availableWeeks.map((week) => (
                        <SelectItem 
                          key={`${week.number}-${week.programTitle}`} 
                          value={`${week.number}-${week.programTitle}`}
                        >
                          Week {week.number} - {week.programTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {filteredWorkouts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-muted-foreground">
                    {weekFilter === "all" 
                      ? "You don't have any assigned workouts yet."
                      : "No workouts found for the selected filter."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredWorkouts.map((workout) => (
                  <Card key={workout.id}>
                    <CardHeader>
                      <CardTitle>
                        {workout.workout?.title || 'Untitled Workout'}
                      </CardTitle>
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
