
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { WorkoutHistoryItem } from '@/types/workout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import WorkoutProgressCard from './WorkoutProgressCard';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import { PlusCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { fetchCurrentProgram } from '@/services/program-service';
import { ProgramProgressSection } from './ProgramProgressSection';

const WorkoutsList = () => {
  console.log("WorkoutsList: Component rendering");
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [weekFilter, setWeekFilter] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [completedWeeks, setCompletedWeeks] = useState<Record<string, boolean>>({});
  const [tabsKey, setTabsKey] = useState(0); // For forcing remounting
  const didFetchWorkouts = useRef(false);
  
  const { data: currentProgram, isLoading: isLoadingProgram } = useQuery({
    queryKey: ['current-program', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("WorkoutsList: Fetching current program for user", user.id);
      try {
        return await fetchCurrentProgram(user.id);
      } catch (error) {
        console.error("WorkoutsList: Error fetching current program:", error);
        return null;
      }
    },
    enabled: !!user?.id,
  });

  const { 
    data: workoutsData, 
    isLoading: isLoadingWorkouts,
    error: workoutsError,
    refetch: refetchWorkouts
  } = useQuery({
    queryKey: ['assigned-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return { workouts: [], groupedWorkouts: {} };
      
      console.log("WorkoutsList: Fetching assigned workouts for user", user.id);
      try {
        const workouts = await fetchAssignedWorkouts();
        
        // Group workouts by week
        const groupedWorkouts: Record<string, WorkoutHistoryItem[]> = {};
        
        workouts.forEach(workout => {
          const weekKey = workout.program_week_title || 'Other';
          if (!groupedWorkouts[weekKey]) {
            groupedWorkouts[weekKey] = [];
          }
          groupedWorkouts[weekKey].push(workout);
        });
        
        // Update completedWeeks status
        const newCompletedWeeks: Record<string, boolean> = {};
        Object.entries(groupedWorkouts).forEach(([weekKey, weekWorkouts]) => {
          const allCompleted = weekWorkouts.every(w => w.status === 'completed');
          newCompletedWeeks[weekKey] = allCompleted && weekWorkouts.length > 0;
        });
        setCompletedWeeks(newCompletedWeeks);
        
        // Set default expanded week if no filter is selected
        if (!weekFilter && Object.keys(groupedWorkouts).length > 0) {
          const currentWeek = Object.keys(groupedWorkouts).find(week => 
            !newCompletedWeeks[week] && groupedWorkouts[week].length > 0
          ) || Object.keys(groupedWorkouts)[0];
          
          if (currentWeek) {
            setWeekFilter(currentWeek);
            setExpandedWeeks(prev => ({
              ...prev,
              [currentWeek]: true
            }));
          }
        }
        
        console.log(`WorkoutsList: Fetched ${workouts.length} workouts, grouped into ${Object.keys(groupedWorkouts).length} weeks`);
        didFetchWorkouts.current = true;
        
        return { 
          workouts,
          groupedWorkouts
        };
      } catch (error) {
        console.error("WorkoutsList: Error fetching assigned workouts:", error);
        return { workouts: [], groupedWorkouts: {} };
      }
    },
    enabled: !!user?.id,
  });

  const workouts = workoutsData?.workouts || [];
  const groupedWorkouts = workoutsData?.groupedWorkouts || {};
  
  const toggleExpandedItem = useCallback((id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);
  
  const toggleExpandedWeek = useCallback((week: string) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [week]: !prev[week]
    }));
  }, []);
  
  const handleWeekFilterSelect = useCallback((week: string | null) => {
    setWeekFilter(week);
    
    if (week) {
      setExpandedWeeks(prev => ({
        ...prev,
        [week]: true
      }));
    } else {
      // Clear all expanded weeks if 'All Weeks' is selected
      setExpandedWeeks({});
    }
  }, []);
  
  const filterWorkoutsByWeek = useCallback((workouts: WorkoutHistoryItem[], week: string | null) => {
    if (!week) return workouts;
    return workouts.filter(workout => (workout.program_week_title || 'Other') === week);
  }, []);

  const getCompletionStatus = useCallback((workout: WorkoutHistoryItem) => {
    if (workout.status === 'completed') {
      return (
        <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
          Completed
        </span>
      );
    } else if (workout.status === 'in_progress') {
      return (
        <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
          In Progress
        </span>
      );
    } else {
      return (
        <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
          Not Started
        </span>
      );
    }
  }, []);

  // Only show program weeks that have workouts
  const programWeeks = Object.keys(groupedWorkouts).filter(week => 
    groupedWorkouts[week] && groupedWorkouts[week].length > 0
  );
  
  useEffect(() => {
    if (user?.id && !didFetchWorkouts.current) {
      console.log("WorkoutsList: User ID changed, refetching workouts");
      refetchWorkouts();
      setTabsKey(prev => prev + 1);
    }
  }, [user?.id, refetchWorkouts]);
  
  // Overall loading state
  const isLoading = isLoadingProgram || isLoadingWorkouts;
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-client mx-auto"></div>
          <p className="text-muted-foreground">Loading your workouts...</p>
        </div>
      </div>
    );
  }
  
  if (workoutsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading workouts. Please try again later.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refetchWorkouts()}
        >
          Retry
        </Button>
      </div>
    );
  }
  
  if (workouts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Add the ProgramProgressSection at the top */}
        <ProgramProgressSection />
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have any assigned workouts yet.</p>
        </div>
        
        {/* Quick Actions moved below the workouts */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          
          <Button asChild variant="outline" className="w-full mt-4 mb-4 flex items-center justify-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <Link to="/client-dashboard/workouts/one-off">
              <PlusCircle className="h-4 w-4" />
              Enter Custom Workout
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const filteredWorkouts = filterWorkoutsByWeek(workouts, weekFilter);
  const isSelectedWeekCompleted = weekFilter ? completedWeeks[weekFilter] : false;

  return (
    <div className="space-y-6">
      {/* Add the ProgramProgressSection at the top */}
      <ProgramProgressSection />
      
      <div className="space-y-4">
        {currentProgram && currentProgram.program && (
          <div className="text-center space-y-1 flex-1">
            <h2 className="text-lg font-medium">{currentProgram.program.title}</h2>
            <div className="text-sm text-muted-foreground">
              Current Program
            </div>
          </div>
        )}
        
        {programWeeks.length > 1 && (
          <div className="my-4 border-b pb-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="weeks">
                <AccordionTrigger className="py-2">
                  <span className="text-sm font-medium">
                    {weekFilter ? `Week: ${weekFilter}` : "All Weeks"}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                    {/* "All Weeks" option */}
                    <Button
                      variant={weekFilter === null ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-auto py-1.5"
                      onClick={() => handleWeekFilterSelect(null)}
                    >
                      All Weeks
                    </Button>
                    
                    {/* Week filter buttons */}
                    {programWeeks.map(week => (
                      <Button
                        key={week}
                        variant={weekFilter === week ? "default" : "outline"}
                        size="sm"
                        className={`text-xs h-auto py-1.5 ${
                          completedWeeks[week] ? "bg-emerald-500 hover:bg-emerald-600" : ""
                        }`}
                        onClick={() => handleWeekFilterSelect(week)}
                      >
                        {week}
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
        
        {weekFilter && (
          <div className="text-sm mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">
                {weekFilter}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isSelectedWeekCompleted 
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}>
                {isSelectedWeekCompleted ? "Completed" : "In Progress"}
              </span>
            </div>
          </div>
        )}
        
        {filteredWorkouts.length > 0 ? (
          <div className="space-y-3">
            {filteredWorkouts.map(workout => (
              <WorkoutProgressCard
                key={workout.workout_completion_id}
                workout={workout}
                onClick={() => toggleExpandedItem(workout.workout_completion_id)}
                isExpanded={!!expandedItems[workout.workout_completion_id]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No workouts found for this week.</p>
          </div>
        )}
      </div>
      
      {/* Quick Actions moved below the workouts */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        
        <Button asChild variant="outline" className="w-full mt-4 mb-4 flex items-center justify-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
          <Link to="/client-dashboard/workouts/one-off">
            <PlusCircle className="h-4 w-4" />
            Enter Custom Workout
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default WorkoutsList;
