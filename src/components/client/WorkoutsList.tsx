
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Filter, ChevronDown, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutCard } from './WorkoutCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LogActivityButtons } from './LogActivityButtons';
import LifeHappensButton from './LifeHappensButton';
import { formatInTimeZone } from 'date-fns-tz';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { fetchCurrentProgram } from '@/services/program-service';
import { fetchGroupMembers } from '@/services/group-member-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { ProgramProgressSection } from './ProgramProgressSection';

// Storage key for the week filter preference
const WEEK_FILTER_KEY = 'workout_week_filter';

const WorkoutsList = () => {
  console.log("WorkoutsList: Component rendering");
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient(); // Add queryClient for cache management
  
  const [weekFilter, setWeekFilter] = useState<string>("");
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [localWorkoutState, setLocalWorkoutState] = useState<{
    pending: WorkoutHistoryItem[];
    completed: WorkoutHistoryItem[];
  }>({ pending: [], completed: [] });

  // Fetch group members
  const { data: groupMembers = [] } = useQuery({
    queryKey: ['group-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log("WorkoutsList: Fetching group members");
      try {
        const members = await fetchGroupMembers(user.id);
        console.log("WorkoutsList: Group members loaded:", members);
        return members;
      } catch (error) {
        console.error('WorkoutsList: Error loading group members:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  // Fetch current program
  const { data: currentProgram } = useQuery({
    queryKey: ['current-program', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("WorkoutsList: Fetching current program");
      try {
        const program = await fetchCurrentProgram(user.id);
        console.log("WorkoutsList: Program data received:", program);
        return program;
      } catch (error) {
        console.error('WorkoutsList: Error loading program:', error);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch assigned workouts
  const { 
    data: workouts = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['assigned-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log("WorkoutsList: Calling fetchAssignedWorkouts");
      try {
        const assignedWorkouts = await fetchAssignedWorkouts(user.id);
        console.log("WorkoutsList: Assigned workouts loaded:", assignedWorkouts.length);
        return assignedWorkouts;
      } catch (error) {
        console.error('WorkoutsList: Error loading assigned workouts:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes before refetching
    gcTime: 1000 * 60 * 10, // 10 minutes before garbage collection
  });

  // Save week filter to localStorage whenever it changes
  useEffect(() => {
    if (weekFilter) {
      localStorage.setItem(WEEK_FILTER_KEY, weekFilter);
      console.log("WorkoutsList: Saved week filter to localStorage:", weekFilter);
    }
  }, [weekFilter]);

  // Process workout data when available
  useEffect(() => {
    if (!workouts.length || !currentProgram) return;
    
    // Extract available weeks
    const weeksSet = new Set<number>();
    workouts.forEach(workout => {
      if (workout.workout?.week && workout.workout.week.week_number) {
        weeksSet.add(workout.workout.week.week_number);
      }
    });
    
    const extractedWeeks = Array.from(weeksSet);
    console.log("WorkoutsList: Extracted week numbers:", extractedWeeks);
    setAvailableWeeks(extractedWeeks);
    
    if (extractedWeeks.length > 0) {
      const sortedWeeks = [...extractedWeeks].sort((a, b) => a - b);
      
      // Check if there's a stored week filter
      const storedWeekFilter = localStorage.getItem(WEEK_FILTER_KEY);
      
      // If we have a stored filter and it's in the available weeks, use it
      if (storedWeekFilter && sortedWeeks.includes(parseInt(storedWeekFilter, 10))) {
        console.log(`WorkoutsList: Restoring saved week filter: ${storedWeekFilter}`);
        setTimeout(() => {
          setWeekFilter(storedWeekFilter);
        }, 0);
        return;
      }
      
      // Otherwise calculate current week as before
      let currentWeekNumber = 1;
      if (currentProgram && currentProgram.start_date) {
        // Use Pacific Time to calculate current week
        const nowPT = new Date();
        
        // Get program start date in Pacific Time
        const startDatePT = new Date(formatInTimeZone(new Date(currentProgram.start_date), 'America/Los_Angeles', 'yyyy-MM-dd'));
        
        // Adjust program start to nearest Monday (week start)
        const programStartDay = startDatePT.getDay();
        const daysUntilFirstMonday = programStartDay === 0 ? 1 : (programStartDay === 1 ? 0 : 8 - programStartDay);
        const firstProgramMonday = new Date(startDatePT);
        firstProgramMonday.setDate(startDatePT.getDate() + daysUntilFirstMonday);
        firstProgramMonday.setHours(0, 0, 0, 0);
        
        // Calculate weeks since first Monday
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        let weeksSinceStart = 0;
        
        // If program hasn't reached first Monday yet, we're in week 1
        if (nowPT >= firstProgramMonday) {
          weeksSinceStart = Math.floor((nowPT.getTime() - firstProgramMonday.getTime()) / msPerWeek);
        }
        
        currentWeekNumber = weeksSinceStart + 1;
        
        console.log(`WorkoutsList: Program start date: ${startDatePT.toISOString()}, first Monday: ${firstProgramMonday.toISOString()}, current week: ${currentWeekNumber}`);
      }
      
      // Ensure week number is within program bounds
      currentWeekNumber = Math.min(
        Math.max(1, currentWeekNumber),
        currentProgram?.weeks || 4
      );
      
      const weekExists = sortedWeeks.includes(currentWeekNumber);
      const initialWeek = weekExists ? currentWeekNumber : sortedWeeks[0];
      console.log(`WorkoutsList: Setting initial week filter to ${weekExists ? 'current' : 'first available'} week: ${initialWeek}`);
      
      setTimeout(() => {
        setWeekFilter(initialWeek.toString());
      }, 0);
    }
  }, [workouts, currentProgram]);

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
    
    return filtered.sort((a, b) => {
      const priorityA = a.workout?.priority ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.workout?.priority ?? Number.MAX_SAFE_INTEGER;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return (a.workout?.day_of_week ?? 0) - (b.workout?.day_of_week ?? 0);
    });
  }, [workouts, weekFilter]);

  // Update local workout state when filteredWorkouts changes
  useEffect(() => {
    const pending = filteredWorkouts.filter(workout => !workout.completed_at);
    const completed = filteredWorkouts.filter(workout => !!workout.completed_at);
    
    setLocalWorkoutState({
      pending,
      completed
    });
  }, [filteredWorkouts]);

  const handleWeekFilterChange = useCallback((value: string) => {
    console.log(`Setting week filter to: ${value}`);
    setWeekFilter(value);
    setIsSelectOpen(false);
  }, []);

  const toggleSelectDropdown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSelectOpen(prev => !prev);
  }, []);

  const closeSelectDropdown = useCallback(() => {
    setIsSelectOpen(false);
  }, []);

  const handleWeekSelect = useCallback((e: React.MouseEvent, weekNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleWeekFilterChange(weekNumber);
  }, [handleWeekFilterChange]);

  const handleStartWorkout = useCallback((workoutId: string) => {
    navigate(`/client-dashboard/workouts/active/${workoutId}`);
  }, [navigate]);

  // Handler for workout completion
  const handleWorkoutCompleted = useCallback((workoutId: string) => {
    console.log("WorkoutsList: Workout completed:", workoutId);
    
    // Optimistically update the local state
    setLocalWorkoutState(prevState => {
      const workout = prevState.pending.find(w => w.id === workoutId);
      
      if (!workout) return prevState;
      
      const updatedWorkout = {
        ...workout,
        completed_at: new Date().toISOString()
      };
      
      return {
        pending: prevState.pending.filter(w => w.id !== workoutId),
        completed: [updatedWorkout, ...prevState.completed]
      };
    });
    
    // Invalidate the query to get fresh data on the next render
    queryClient.invalidateQueries({ queryKey: ['assigned-workouts', user?.id] });
  }, [queryClient, user?.id]);

  const isLifeHappensPass = (workout: any): boolean => {
    return workout?.life_happens_pass === true || workout?.workout_type === 'life_happens';
  };

  // Check URL params for calendar status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarStatus = urlParams.get('calendar');
    const error = urlParams.get('error');
    
    if (calendarStatus === 'connected') {
      toast.success('Google Calendar connected successfully');
      navigate('/client-dashboard/workouts', { replace: true });
    } else if (error) {
      toast.error(decodeURIComponent(error));
      navigate('/client-dashboard/workouts', { replace: true });
    }
  }, [navigate]);

  // Handle click outside select dropdown
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

  const pendingWorkouts = localWorkoutState.pending;
  const completedWorkouts = localWorkoutState.completed;

  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-client dark:text-blue-300" />
        <p>Loading your workouts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-500 dark:text-red-400 mb-4">Failed to load your assigned workouts</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  console.log("WorkoutsList: Rendering with group members:", groupMembers);

  const allGroupMembers = groupMembers.some(member => member.id === user?.id)
    ? groupMembers
    : [
        ...groupMembers,
        {
          id: user?.id || '',
          name: user?.email?.split('@')[0] || 'You',
          profile_picture_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'You'}`,
          completed_workout_ids: completedWorkouts.map(w => w.id)
        }
      ];

  console.log("WorkoutsList: Final group members for cards:", allGroupMembers);

  // Setup event listener for workout completion event - moved outside of render
  useEffect(() => {
    const handleWorkoutCompletedEvent = () => {
      console.log("WorkoutsList: Global workout-completed event received");
      queryClient.invalidateQueries({ queryKey: ['assigned-workouts', user?.id] });
    };
    
    document.addEventListener('workout-completed', handleWorkoutCompletedEvent);
    
    return () => {
      document.removeEventListener('workout-completed', handleWorkoutCompletedEvent);
    };
  }, [queryClient, user?.id]);

  return (
    <div className="space-y-4">
      <ProgramProgressSection />
      
      <div className="space-y-6">
        {availableWeeks.length > 0 && (
          <div className="flex justify-center mb-2">
            <div className="relative" ref={selectRef}>
              <button
                className="flex w-[200px] h-8 text-sm items-center justify-between rounded-md border border-input bg-card px-3 py-2 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Pending Workouts</h3>
          {pendingWorkouts.length === 0 ? (
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-muted-foreground">
                  No pending workouts for this week.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
              <div className="flex w-full gap-3 px-1 pb-4">
                {pendingWorkouts.map((workout) => (
                  <div key={workout.id} className="w-[300px] flex-none">
                    <WorkoutCard
                      workoutId={workout.id}
                      title={workout.title || workout.workout?.title || "Workout"}
                      description={workout.description || workout.workout?.description}
                      type={workout.workout_type || workout.workout?.workout_type}
                      groupMembers={allGroupMembers}
                      currentUserId={user?.id || ''}
                      onStartWorkout={handleStartWorkout}
                      completed={!!workout.completed_at}
                      dayOfWeek={workout.workout?.day_of_week}
                      exercises={workout.workout?.workout_exercises || []}
                      isLifeHappensPass={isLifeHappensPass(workout)}
                      onWorkoutCompleted={handleWorkoutCompleted}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>
          )}
        </div>
        
        {completedWorkouts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Completed Workouts</h3>
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
              <div className="flex w-full gap-3 px-1 pb-4">
                {completedWorkouts.map((workout) => (
                  <div key={workout.id} className="w-[300px] flex-none">
                    <WorkoutCard
                      workoutId={workout.id}
                      title={workout.title || workout.workout?.title || "Workout"}
                      description={workout.description || workout.workout?.description}
                      type={workout.workout_type || workout.workout?.workout_type}
                      groupMembers={allGroupMembers}
                      currentUserId={user?.id || ''}
                      onStartWorkout={handleStartWorkout}
                      completed={!!workout.completed_at}
                      dayOfWeek={workout.workout?.day_of_week}
                      exercises={workout.workout?.workout_exercises || []}
                      isLifeHappensPass={isLifeHappensPass(workout)}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>
          </div>
        )}
      </div>
      
      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-lg font-medium mb-4">Add Other Activity</h3>
        
        <LogActivityButtons />
        
        <Button 
          asChild 
          variant="outline" 
          className="w-full mt-4 flex items-center justify-between text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 shadow-lg"
        >
          <Link to="/client-dashboard/workouts/one-off">
            <div className="flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              <span>Enter Custom Workout</span>
            </div>
          </Link>
        </Button>
        
        <LifeHappensButton />
      </div>
    </div>
  );
};

export default WorkoutsList;
