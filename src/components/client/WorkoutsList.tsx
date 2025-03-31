import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Filter, ChevronDown, ChevronUp, Play, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { fetchCurrentProgram } from '@/services/program-service';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface WorkoutsListProps {
  workouts: WorkoutHistoryItem[];
}

const WorkoutsList: React.FC<WorkoutsListProps> = ({ workouts: initialWorkouts }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>(initialWorkouts || []);
  const [isLoading, setIsLoading] = useState(initialWorkouts ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<string>("");
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [currentProgram, setCurrentProgram] = useState<any | null>(null);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});
  const [completedWeeks, setCompletedWeeks] = useState<Record<string, boolean>>({});
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Safely toggle workout details 
  const toggleWorkoutDetails = useCallback((e: React.MouseEvent, workoutId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedWorkouts(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId]
    }));
  }, []);

  // Only load workouts if none were provided as props
  useEffect(() => {
    if (initialWorkouts && initialWorkouts.length > 0) {
      // If workouts are provided via props, use them directly
      setWorkouts(initialWorkouts);
      processWorkouts(initialWorkouts);
    } else {
      // Otherwise load them from the API
      loadWorkoutsAndProgram();
    }
  }, [initialWorkouts, user]);

  // Function to process workouts (extract common logic from loadWorkoutsAndProgram)
  const processWorkouts = (assignedWorkouts: WorkoutHistoryItem[]) => {
    // Determine which weeks are completed by checking if all workouts for that week are completed
    const weekCompletionStatus: Record<string, boolean> = {};
    const weeksSet = new Set<number>();
    
    // Group all workouts by week
    const workoutsByWeek: Record<number, WorkoutHistoryItem[]> = {};
    
    assignedWorkouts.forEach(workout => {
      if (workout.workout?.week && workout.workout.week.week_number) {
        const weekNum = workout.workout.week.week_number;
        weeksSet.add(weekNum);
        
        if (!workoutsByWeek[weekNum]) {
          workoutsByWeek[weekNum] = [];
        }
        workoutsByWeek[weekNum].push(workout);
      }
    });
    
    // Check if all workouts in each week are completed
    Object.entries(workoutsByWeek).forEach(([weekNum, weekWorkouts]) => {
      const allCompleted = weekWorkouts.every(workout => !!workout.completed_at);
      weekCompletionStatus[weekNum] = allCompleted;
    });
    
    setCompletedWeeks(weekCompletionStatus);
    
    assignedWorkouts.forEach(workout => {
      if (workout.workout?.week && workout.workout.week.week_number) {
        weeksSet.add(workout.workout.week.week_number);
      }
    });
    
    const extractedWeeks = Array.from(weeksSet);
    console.log("Debug - Extracted week numbers:", extractedWeeks);
    setAvailableWeeks(extractedWeeks);
    
    if (extractedWeeks.length > 0) {
      const sortedWeeks = [...extractedWeeks].sort((a, b) => a - b);
      // Set initial week filter after component is fully mounted
      setTimeout(() => {
        setWeekFilter(sortedWeeks[0].toString());
      }, 0);
    }
  };

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
      
      // Filter out completed workouts here
      const pendingWorkouts = assignedWorkouts.filter(workout => !workout.completed_at);
      console.log("Pending workouts (not completed):", pendingWorkouts.length);
      
      setCurrentProgram(program);
      setWorkouts(pendingWorkouts);
      
      // Get all workouts (including completed) for checking completed weeks
      const allWorkouts = assignedWorkouts;
      
      // Determine which weeks are completed by checking if all workouts for that week are completed
      const weekCompletionStatus: Record<string, boolean> = {};
      const weeksSet = new Set<number>();
      
      // Group all workouts by week
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
      
      // Check if all workouts in each week are completed
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
        // Set initial week filter after component is fully mounted
        setTimeout(() => {
          setWeekFilter(sortedWeeks[0].toString());
        }, 0);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      setError('Failed to load your assigned workouts');
      toast.error('There was a problem loading your workouts');
    } finally {
      setIsLoading(false);
    }
  };

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
      
      if (workout.workout && workout.workout.week) {
        console.log(`Debug - Workout ${workout.id} - Week: ${workout.workout.week.week_number}, Program: ${workout.workout.week.program?.title}, Matches: ${weekMatches}`);
      }
      
      return weekMatches;
    });
    
    // Sort workouts by priority first, then by day_of_week as a backup
    return filtered.sort((a, b) => {
      // First by priority (lower number = higher priority)
      const priorityA = a.workout?.priority ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.workout?.priority ?? Number.MAX_SAFE_INTEGER;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If priority is the same, sort by day_of_week
      return (a.workout?.day_of_week ?? 0) - (b.workout?.day_of_week ?? 0);
    });
  }, [workouts, weekFilter]);

  // Handle week filter change - completely rewritten
  const handleWeekFilterChange = useCallback((value: string) => {
    console.log(`Setting week filter to: ${value}`);
    setWeekFilter(value);
    setIsSelectOpen(false);
  }, []);

  // Toggle select dropdown visibility
  const toggleSelectDropdown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSelectOpen(prev => !prev);
  }, []);

  // Close select dropdown
  const closeSelectDropdown = useCallback(() => {
    setIsSelectOpen(false);
  }, []);

  // Handle week selection
  const handleWeekSelect = useCallback((e: React.MouseEvent, weekNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleWeekFilterChange(weekNumber);
  }, [handleWeekFilterChange]);

  // Navigate to active workout
  const handleStartWorkout = useCallback((e: React.MouseEvent, workoutId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/client-dashboard/workouts/active/${workoutId}`);
  }, [navigate]);

  // Close select dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        closeSelectDropdown();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeSelectDropdown]);

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

  // Check if the selected week is completed
  const isSelectedWeekCompleted = weekFilter ? completedWeeks[weekFilter] : false;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
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
        
        {availableWeeks.length > 0 && (
          <div className="flex justify-center mb-2">
            {/* Custom dropdown implementation */}
            <div className="relative" ref={selectRef}>
              <button
                className="flex w-[200px] h-8 text-sm items-center justify-between rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={toggleSelectDropdown}
              >
                <div className="flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span>{weekFilter ? `Week ${weekFilter}` : "Filter by week"}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
              
              {isSelectOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
                  <div className="p-1">
                    {availableWeeks
                      .sort((a, b) => a - b)
                      .map((weekNumber) => (
                        <button
                          key={weekNumber}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          onClick={(e) => handleWeekSelect(e, weekNumber.toString())}
                        >
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            {weekFilter === weekNumber.toString() && (
                              <div className="h-4 w-4 flex items-center justify-center">✓</div>
                            )}
                          </span>
                          {`Week ${weekNumber}`}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
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
                  onOpenChange={() => {}}
                >
                  <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">
                      {workout.workout?.title || 'Untitled Workout'}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 ml-2"
                      onClick={(e) => toggleWorkoutDetails(e, workout.id)}
                    >
                      {expandedWorkouts[workout.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="sr-only">Toggle details</span>
                    </Button>
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
                            {workout.workout.workout_exercises.map((exercise) => (
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
                  <Button 
                    className="w-full h-9 py-1" 
                    size="sm"
                    onClick={(e) => handleStartWorkout(e, workout.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Workout
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
