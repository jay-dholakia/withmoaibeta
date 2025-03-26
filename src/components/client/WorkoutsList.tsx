
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
import { fetchCurrentProgram } from '@/services/program-service';
import { supabase } from '@/integrations/supabase/client';

const WorkoutsList = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [availableWeeks, setAvailableWeeks] = useState<{number: number, title: string, programId: string}[]>([]);
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
        
        // More detailed logging for program data
        console.log("Current user email:", user.email);
        console.log("Program data received:", program);
        if (program && program.program) {
          console.log("Program title:", program.program.title);
          console.log("Program description:", program.program.description || "No description");
          console.log("Program weeks data:", program.program.weekData);
        } else {
          console.log("No program assigned to this user or program data is incomplete");
        }
        
        console.log("Assigned workouts loaded:", assignedWorkouts.length);
        
        setCurrentProgram(program);
        setWorkouts(assignedWorkouts);
        
        // Fetch all weeks directly from the workout_weeks table to ensure we have complete data
        if (program && program.program) {
          const { data: weeksData, error: weeksError } = await supabase
            .from('workout_weeks')
            .select('id, week_number, title, program_id')
            .eq('program_id', program.program.id)
            .order('week_number', { ascending: true });
            
          if (weeksError) {
            console.error('Error fetching weeks from database:', weeksError);
            // We'll still try to use the weeks from the workouts as fallback
          } else if (weeksData && weeksData.length > 0) {
            console.log("Weeks fetched directly from database:", weeksData.length);
            // Map the weeks data to our expected format
            const mappedWeeks = weeksData.map(week => ({
              number: week.week_number,
              title: week.title || `Week ${week.week_number}`,
              programId: week.program_id
            }));
            setAvailableWeeks(mappedWeeks);
            
            // Set default filter to the first week
            if (mappedWeeks.length > 0) {
              setWeekFilter(`${mappedWeeks[0].number}-${mappedWeeks[0].programId}`);
            }
            
            // Skip the extraction from workouts since we have the data directly
            return;
          }
        }
        
        // Fallback: Extract unique weeks from workouts as before
        const weeksMap = new Map<string, {number: number, title: string, programId: string}>();
        
        // Debug logging for workouts
        console.log("Debug - All workouts:", assignedWorkouts);
        
        assignedWorkouts.forEach(workout => {
          if (workout.workout?.week) {
            // Debug logging for each workout
            console.log(`Debug - Workout Week:`, workout.workout.week);
            
            // Get the week number and title from the workout
            const weekNumber = workout.workout.week.week_number || 0;
            // Since week doesn't have title in the type, we'll create one
            const weekTitle = `Week ${weekNumber}`;
            const programId = workout.workout.week.program?.id || '';
            
            const key = `${weekNumber}-${programId}`;
            if (!weeksMap.has(key)) {
              weeksMap.set(key, {
                number: weekNumber,
                title: weekTitle,
                programId: programId
              });
            }
          }
        });
        
        const extractedWeeks = Array.from(weeksMap.values());
        console.log("Debug - Extracted weeks from workouts:", extractedWeeks);
        setAvailableWeeks(extractedWeeks);
        
        // Set default filter to the current week if available
        if (extractedWeeks.length > 0) {
          // Sort weeks by number (ascending)
          const sortedWeeks = [...extractedWeeks].sort((a, b) => a.number - b.number);
          
          // Find current week or closest week to current
          const currentWeekValue = `${sortedWeeks[0].number}-${sortedWeeks[0].programId}`;
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
    
    const [weekNumberStr, programId] = weekFilter.split('-');
    const weekNumber = parseInt(weekNumberStr);
    
    console.log(`Debug - Filtering workouts by Week ${weekNumber}`);
    
    return workouts.filter(workout => {
      // Check if workout has week data and if week number matches
      const weekMatches = workout.workout?.week?.week_number === weekNumber;
      
      // Check if program matches
      const programMatches = workout.workout?.week?.program?.id === programId;
      
      console.log(`Debug - Workout ${workout.id} - Week: ${workout.workout?.week?.week_number}, Program: ${workout.workout?.week?.program?.id}, Matches: ${weekMatches && programMatches}`);
      
      // Only return workouts that match both the week number and program ID
      return weekMatches && programMatches;
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
          <div className="space-y-6">
            {currentProgram && currentProgram.program && (
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{currentProgram.program.title}</h2>
                {currentProgram.program.description && (
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    {currentProgram.program.description}
                  </p>
                )}
              </div>
            )}
            
            {availableWeeks.length > 0 && (
              <div className="flex justify-center">
                <Select
                  value={weekFilter}
                  onValueChange={setWeekFilter}
                >
                  <SelectTrigger className="w-[220px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Filter by week" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weeks</SelectItem>
                    {availableWeeks
                      .sort((a, b) => a.number - b.number)
                      .map((week) => (
                        <SelectItem 
                          key={`${week.number}-${week.programId}`} 
                          value={`${week.number}-${week.programId}`}
                        >
                          {week.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
                            {`Week ${workout.workout.week.week_number}`}
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
