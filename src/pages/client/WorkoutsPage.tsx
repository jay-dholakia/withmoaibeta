
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import EnterOneOffWorkout from '@/components/client/EnterOneOffWorkout';
import { Button } from '@/components/ui/button';
import { Armchair, ListTodo, History, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { logRestDay } from '@/services/workout-history-service';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentProgram } from '@/services/program-service';

const WorkoutsPage = () => {
  const [showRestDayDialog, setShowRestDayDialog] = useState(false);
  const [restDate, setRestDate] = useState<Date>(new Date());
  const location = useLocation();
  const { user } = useAuth();
  
  console.log("WorkoutsPage component rendering");
  
  const isMainWorkoutsPage = location.pathname === "/client-dashboard/workouts";
  
  const isActiveOrCompleteWorkout = location.pathname.includes('/active/') || 
                                   location.pathname.includes('/complete/');
  
  const { data: currentProgram } = useQuery({
    queryKey: ['current-program', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await fetchCurrentProgram(user.id);
    },
    enabled: !!user?.id,
  });
  
  const handleLogRestDay = () => {
    logRestDay(restDate).then(() => {
      toast.success("Rest day logged successfully!");
      setShowRestDayDialog(false);
    }).catch((error) => {
      console.error("Error logging rest day:", error);
      toast.error("Failed to log rest day");
      setShowRestDayDialog(false);
    });
  };

  // Force re-render of child components when user auth changes
  useEffect(() => {
    console.log("Auth state changed in WorkoutsPage, user:", user?.id);
    // No action needed - the effect dependency will trigger re-renders of children
  }, [user]);
  
  // Display program information if available
  const getProgramInfo = () => {
    if (!currentProgram || !currentProgram.program) {
      return null;
    }
    
    const startDate = new Date(currentProgram.start_date);
    const currentDate = new Date();
    
    // Calculate days elapsed
    const msInDay = 1000 * 60 * 60 * 24;
    const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / msInDay);
    const currentWeek = Math.floor(daysElapsed / 7) + 1;
    
    const weekStartDay = (currentWeek - 1) * 7;
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + weekStartDay);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return (
      <div className="text-center mb-4 text-muted-foreground text-sm">
        <p>
          <span className="font-medium">{currentProgram.program.title}</span>
          {" • "}
          Week {currentWeek}: {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Routes>
        <Route index element={
          <Tabs defaultValue="active-workouts" className="w-full">
            {getProgramInfo()}
            <TabsList className="w-full mb-6 grid grid-cols-2">
              <TabsTrigger value="active-workouts" className="flex items-center justify-center gap-2">
                <ListTodo className="h-4 w-4" />
                <span className="whitespace-nowrap">Assigned Workouts</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center justify-center gap-2">
                <History className="h-4 w-4" />
                <span className="whitespace-nowrap">Other Activity</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active-workouts">
              <WorkoutsList />
            </TabsContent>
            
            <TabsContent value="history">
              <div className="mb-2">
                <Button asChild variant="outline" className="w-full mb-4 flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Link to="/client-dashboard/workouts/one-off">
                    <PlusCircle className="h-4 w-4" />
                    Enter Custom Workout
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => setShowRestDayDialog(true)}
                >
                  <Armchair className="h-4 w-4" />
                  Log Rest Day
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        } />
        <Route path="active/:workoutCompletionId" element={<ActiveWorkout key={user?.id} />} />
        <Route path="complete/:workoutCompletionId" element={<WorkoutComplete key={user?.id} />} />
        <Route path="create" element={<CreateCustomWorkout />} />
        <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
        <Route path="one-off" element={<EnterOneOffWorkout key={user?.id} />} />
        <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
      </Routes>
      
      <Dialog open={showRestDayDialog} onOpenChange={setShowRestDayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Armchair className="h-5 w-5 text-green-600" />
              <span>Log a Rest Day</span>
            </DialogTitle>
            <DialogDescription>
              Select a date and log your well-deserved rest day.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="rest-date" className="text-sm font-medium">
                Rest Day Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="rest-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !restDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {restDate ? format(restDate, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={restDate}
                    onSelect={(date) => date && setRestDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <Button variant="ghost" onClick={() => setShowRestDayDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLogRestDay}
              className="bg-green-600 hover:bg-green-700"
            >
              Yes, Log My Rest Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutsPage;
