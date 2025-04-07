
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import EnterOneOffWorkout from '@/components/client/EnterOneOffWorkout';
import WorkoutHistoryTab from '@/components/client/WorkoutHistoryTab';
import { Button } from '@/components/ui/button';
import { Armchair, ListTodo, History, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { logRestDay } from '@/services/activity-logging-service';
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
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentProgram } from '@/services/program-service';
import { getCurrentWeekNumber, formatWeekDateRange } from '@/services/assigned-workouts-service';

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
    logRestDay({
      log_date: restDate,
      notes: "Rest day logged from workouts page"
    }).then((result) => {
      if (result) {
        toast.success("Rest day logged successfully!");
        setShowRestDayDialog(false);
        
        // Find the refresh button for workout history and click it if it exists
        const refreshButton = document.getElementById("refresh-workout-history");
        if (refreshButton) {
          refreshButton.click();
        }
      }
    }).catch((error) => {
      console.error("Error logging rest day:", error);
      toast.error("Failed to log rest day");
      setShowRestDayDialog(false);
    });
  };

  useEffect(() => {
    console.log("Auth state changed in WorkoutsPage, user:", user?.id);
  }, [user]);
  
  return (
    <div className="w-full">
      <Routes>
        <Route index element={
          <Tabs defaultValue="active-workouts" className="w-full">
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
              <WorkoutHistoryTab />
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
              <Armchair className="h-5 w-5 text-amber-600" />
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
              className="bg-amber-600 hover:bg-amber-700"
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
