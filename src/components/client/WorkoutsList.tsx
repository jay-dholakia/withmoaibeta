import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Filter, ChevronDown, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutCard } from './WorkoutCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { fetchCurrentProgram } from '@/services/program-service';
import { ProgramProgressSection } from './ProgramProgressSection';
import { fetchGroupMembers, GroupMember } from '@/services/group-member-service';
import { LogActivityButtons } from './LogActivityButtons';
import LifeHappensButton from './LifeHappensButton';
import { formatInTimeZone } from 'date-fns-tz';
import { addDays, startOfWeek } from 'date-fns';

const WorkoutsList = () => {
  console.log("WorkoutsList: Component rendering");
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekFilter, setWeekFilter] = useState<string>("");
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [currentProgram, setCurrentProgram] = useState<any | null>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadWorkoutsAndProgram = async () => {
      console.log("WorkoutsList: Loading workouts and program");
      if (!user || !user.id) {
        console.error("WorkoutsList: Cannot load workouts - User or user ID is missing", { user });
        setError('User not authenticated properly. Please try logging in again.');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("WorkoutsList: Loading assigned workouts for user:", user.id);
        setIsLoading(true);
        setError(null);
        
        // Load group members first
        try {
          console.log("WorkoutsList: Fetching group members");
          const members = await fetchGroupMembers(user.id);
          console.log("WorkoutsList: Group members loaded:", members);
          setGroupMembers(members);
        } catch (groupError) {
          console.error('WorkoutsList: Error loading group members:', groupError);
          // Continue even if group members fail to load
        }
        
        let program = null;
        try {
          console.log("WorkoutsList: Fetching current program");
          program = await fetchCurrentProgram(user.id);
          console.log("WorkoutsList: Program data received:", program);
        } catch (programError) {
          console.error('WorkoutsList: Error loading program:', programError);
          // Continue even if program fails to load
        }
        
        let assignedWorkouts: WorkoutHistoryItem[] = [];
        try {
          console.log("WorkoutsList: Calling fetchAssignedWorkouts");
          assignedWorkouts = await fetchAssignedWorkouts(user.id);
          console.log("WorkoutsList: Assigned workouts loaded:", assignedWorkouts.length);
        } catch (workoutsError) {
          console.error('WorkoutsList: Error loading assigned workouts:', workoutsError);
          throw workoutsError; // Rethrow to be caught by outer catch
        }
        
        setCurrentProgram(program);
        setWorkouts(assignedWorkouts);
        
        const weeksSet = new Set<number>();
        
        assignedWorkouts.forEach(workout => {
          if (workout.workout?.week && workout.workout.week.week_number) {
            weeksSet.add(workout.workout.week.week_number);
          }
        });
        
        const extractedWeeks = Array.from(weeksSet);
        console.log("WorkoutsList: Extracted week numbers:", extractedWeeks);
        setAvailableWeeks(extractedWeeks);
        
        if (extractedWeeks.length > 0) {
          const sortedWeeks = [...extractedWeeks].sort((a, b) => a - b);
          
          let currentWeekNumber = 1;
          if (program && program.start_date) {
            // Use Pacific Time to calculate current week
            const nowPT = new Date();
            
            // Get program start date in Pacific Time
            const startDatePT = new Date(formatInTimeZone(new Date(program.start_date), 'America/Los_Angeles', 'yyyy-MM-dd'));
            
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
            program?.weeks || 4
          );
          
          const weekExists = sortedWeeks.includes(currentWeekNumber);
          const initialWeek = weekExists ? currentWeekNumber : sortedWeeks[0];
          console.log(`WorkoutsList: Setting initial week filter to ${weekExists ? 'current' : 'first available'} week: ${initialWeek}`);
          
          setTimeout(() => {
            setWeekFilter(initialWeek.toString());
          }, 0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('WorkoutsList: Error loading workouts:', error);
        setError('Failed to load your assigned workouts');
        toast.error('There was a problem loading your workouts');
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarStatus = urlParams.get('calendar');
    const error = urlParams.get('error');
    
    if (calendarStatus === 'connected') {
      toast.success('Google Calendar connected successfully');
      // Clean up URL parameters
      navigate('/client-dashboard/workouts', { replace: true });
    } else if (error) {
      toast.error(decodeURIComponent(error));
      // Clean up URL parameters
      navigate('/client-dashboard/workouts', { replace: true });
    }
  }, [navigate]);

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

  const pendingWorkouts = filteredWorkouts.filter(workout => !workout.completed_at);
  const completedWorkouts = filteredWorkouts.filter(workout => !!workout.completed_at);

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

  return (
    <div className="space-y-6">
      <ProgramProgressSection />
      
      <div className="space-y-4">
        {availableWeeks.length > 0 && (
          <div className="flex justify-center mb-2">
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workoutId={workout.id}
                  title={workout.workout?.title || 'Untitled Workout'}
                  description={workout.workout?.description || ''}
                  type={workout.workout?.workout_type as any}
                  groupMembers={allGroupMembers}
                  currentUserId={user?.id || ''}
                  onStartWorkout={handleStartWorkout}
                  completed={false}
                  dayOfWeek={workout.workout?.day_of_week}
                />
              ))}
            </div>
          )}
        </div>
        
        {completedWorkouts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Completed Workouts</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completedWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workoutId={workout.id}
                  title={workout.workout?.title || 'Untitled Workout'}
                  description={workout.workout?.description || ''}
                  type={workout.workout?.workout_type as any}
                  groupMembers={allGroupMembers}
                  currentUserId={user?.id || ''}
                  onStartWorkout={handleStartWorkout}
                  completed={true}
                  dayOfWeek={workout.workout?.day_of_week}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Add Other Activity</h3>
        
        <LogActivityButtons />
        
        <Button asChild variant="outline" className="w-full mt-4 flex items-center justify-between text-emerald-600 border-emerald-200 hover:bg-emerald-50">
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
