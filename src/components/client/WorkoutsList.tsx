import React, { useEffect, useState } from 'react';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Filter, ChevronDown, ChevronUp, Play, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchCurrentProgram } from '@/services/program-service';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WorkoutsList = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<string>("");
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [currentProgram, setCurrentProgram] = useState<any | null>(null);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});
  const [completedWeeks, setCompletedWeeks] = useState<Record<string, boolean>>({});
  const [isChangingFilter, setIsChangingFilter] = useState(false);
  const [preventAutoNavigation, setPreventAutoNavigation] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (initialLoad || isChangingFilter || preventAutoNavigation) {
      return;
    }
    
    const isActiveWorkoutPage = location.pathname.includes('/active/');
    const isMainPage = location.pathname === "/client-dashboard/workouts";
    
    const isValidSubPage = 
      location.pathname.includes('/active/') || 
      location.pathname.includes('/complete/') ||
      location.pathname.includes('/custom/') ||
      location.pathname.includes('/create') ||
      location.pathname.includes('/one-off');
      
    if (!isMainPage && !isValidSubPage) {
      console.log("Redirecting from invalid workout sub-page:", location.pathname);
      navigate("/client-dashboard/workouts");
    }
  }, [location.pathname, navigate, isChangingFilter, preventAutoNavigation, initialLoad]);

  const toggleWorkoutDetails = (workoutId: string) => {
    setExpandedWorkouts(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId]
    }));
  };

  const handleWeekFilterChange = (value: string) => {
    setIsChangingFilter(true);
    setPreventAutoNavigation(true);
    
    console.log(`Setting week filter to ${value}`);
    
    const needsNavigation = location.pathname !== "/client-dashboard/workouts";
    
    if (needsNavigation) {
      console.log("Navigating to main workouts page before applying filter");
      navigate("/client-dashboard/workouts", { replace: true });
      
      setTimeout(() => {
        console.log("Navigation complete, now applying filter");
        setWeekFilter(value);
        
        setTimeout(() => {
          setIsChangingFilter(false);
          
          setTimeout(() => {
            setPreventAutoNavigation(false);
            console.log("Navigation prevention removed");
          }, 800);
        }, 200);
      }, 400);
    } else {
      setWeekFilter(value);
      
      setTimeout(() => {
        setIsChangingFilter(false);
        
        setTimeout(() => {
          setPreventAutoNavigation(false);
          console.log("Navigation prevention removed");
        }, 800);
      }, 200);
    }
  };

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
        
        const programPromise = fetchCurrentProgram(user.id);
        const workoutsPromise = fetchAssignedWorkouts(user.id);
        
        const [program, assignedWorkouts] = await Promise.all([programPromise, workoutsPromise]);
        
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
        
        const pendingWorkouts = assignedWorkouts.filter(workout => !workout.completed_at);
        console.log("Pending workouts (not completed):", pendingWorkouts.length);
        
        setCurrentProgram(program);
        setWorkouts(pendingWorkouts);
        
        const allWorkouts = assignedWorkouts;
        
        const weekCompletionStatus: Record<string, boolean> = {};
        const weeksSet = new Set<number>();
        
        const workoutsByWeek: Record<number, WorkoutHistoryItem[]> = {};
        
        allWorkouts.forEach(workout => {
          if (workout.workout?.week && workout.workout.week.week_number) {
            const weekNum = workout.workout.week.week_number;
            weeksSet.add(weekNum);
            
            if (!workoutsByWeek[weekNum]) {
              workoutsByWeek[weekNum] = [];
            }
            workoutsByWeek[weekNum].push(workout);
          }
        });
        
        Object.entries(workoutsByWeek).forEach(([weekNum, weekWorkouts]) => {
          const allCompleted = weekWorkouts.every(workout => !!workout.completed_at);
          weekCompletionStatus[weekNum] = allCompleted;
        });
        
        setCompletedWeeks(weekCompletionStatus);
        
        pendingWorkouts.forEach(workout => {
          if (workout.workout?.week && workout.workout.week.week_number) {
            weeksSet.add(workout.workout.week.week_number);
          }
        });
        
        const extractedWeeks = Array.from(weeksSet);
        console.log("Debug - Extracted week numbers:", extractedWeeks);
        setAvailableWeeks(extractedWeeks);
        
        if (extractedWeeks.length > 0) {
          const sortedWeeks = [...extractedWeeks].sort((a, b) => a - b);
          
          setWeekFilter(sortedWeeks[0].toString());
        }
        
        setInitialLoad(false);
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
    if (!weekFilter) {
      return workouts;
    }
    
    const weekNumber = parseInt(weekFilter, 10);
    
    console.log(`Debug - Filtering workouts by Week ${weekNumber}`);
    
    const filtered = workouts.filter(workout => {
      if (!workout.workout || !workout.workout.week) {
        return false;
      }
      
      const weekMatches = workout.workout.week.week_number === weekNumber;
      
      console.log(`Debug - Workout ${workout.id} - Week: ${workout.workout.week.week_number}, Program: ${workout.workout.week.program?.title}, Matches: ${weekMatches}`);
      
      return weekMatches;
    });
    
    return filtered.sort((a, b) => {
      const priorityA = a.workout?.priority ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.workout?.priority ?? Number.MAX_SAFE_INTEGER;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return (a.workout?.day_of_week ?? 0) - (b.workout?.day_of_week ?? 0);
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

  const isSelectedWeekCompleted = weekFilter ? completedWeeks[weekFilter] : false;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {currentProgram && currentProgram.program && (
            <div className="text-center space-y-1 flex-1">
              <h2 className="text-xl font-bold">{currentProgram.program.title}</h2>
              {currentProgram.program.description && (
                <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                  {currentProgram.program.description}
                </p>
              )}
            </div>
          )}
        </div>
        
        {availableWeeks.length > 0 && (
          <div className="flex justify-center mb-2">
            <Select
              value={weekFilter}
              onValueChange={handleWeekFilterChange}
            >
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <div className="flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Filter by week" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableWeeks
                  .sort((a, b) => a - b)
                  .map((weekNumber) => (
                    <SelectItem 
                      key={weekNumber} 
                      value={weekNumber.toString()}
                    >
                      {`Week ${weekNumber}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {isSelectedWeekCompleted ? (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 pb-6 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <h3 className="text-xl font-bold text-green-800 mb-2">
                Congratulations! 🎉💪
              </h3>
              <p className="text-green-700">
                You've completed all workouts in your plan for Week {weekFilter}.
              </p>
            </CardContent>
          </Card>
        ) : filteredWorkouts.length === 0 ? (
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-muted-foreground">
                No workouts found for the selected filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkouts.map((workout) => (
              <Card key={workout.id} className="overflow-hidden">
                <Collapsible
                  open={expandedWorkouts[workout.id] || false}
                  onOpenChange={() => toggleWorkoutDetails(workout.id)}
                >
                  <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">
                      {workout.workout?.title || 'Untitled Workout'}
                    </CardTitle>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-2">
                        {expandedWorkouts[workout.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle details</span>
                      </Button>
                    </CollapsibleTrigger>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <CollapsibleContent className="px-4 pb-2 pt-0 space-y-2">
                      {workout.workout?.description && (
                        <div className="mb-2">
                          <h4 className="text-xs font-medium">Description</h4>
                          <p className="text-xs text-muted-foreground">
                            {workout.workout.description}
                          </p>
                        </div>
                      )}
                      
                      {workout.workout?.workout_exercises && workout.workout.workout_exercises.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium mb-1">Exercises</h4>
                          <Accordion type="single" collapsible className="w-full">
                            {workout.workout.workout_exercises.map((exercise, index) => (
                              <AccordionItem key={exercise.id} value={exercise.id} className="border-b-0 py-0">
                                <div className="flex flex-col">
                                  <AccordionTrigger className="py-1 text-xs">
                                    {exercise.exercise?.name || 'Unknown Exercise'}
                                  </AccordionTrigger>
                                  
                                  <div className="flex flex-wrap gap-2 px-1 py-1 text-xs">
                                    <span className="bg-muted px-2 py-0.5 rounded-md">Sets: {exercise.sets}</span>
                                    <span className="bg-muted px-2 py-0.5 rounded-md">Reps: {exercise.reps}</span>
                                    {exercise.rest_seconds && (
                                      <span className="bg-muted px-2 py-0.5 rounded-md">Rest: {exercise.rest_seconds}s</span>
                                    )}
                                  </div>
                                </div>
                                
                                <AccordionContent className="pb-1">
                                  <div className="space-y-1 text-xs">
                                    {exercise.notes && (
                                      <div className="text-xs bg-muted p-1.5 rounded-md">
                                        <span className="font-medium">Notes:</span> {exercise.notes}
                                      </div>
                                    )}
                                    {exercise.exercise?.description && (
                                      <div className="text-xs bg-muted p-1.5 rounded-md">
                                        <span className="font-medium">Description:</span> {exercise.exercise.description}
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Collapsible>
                
                <CardFooter className="p-3">
                  <Button asChild className="w-full h-9 py-1" size="sm">
                    <Link to={`/client-dashboard/workouts/active/${workout.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Workout
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutsList;
