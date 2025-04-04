
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import EnterOneOffWorkout from '@/components/client/EnterOneOffWorkout';
import WorkoutHistoryTab from '@/components/client/WorkoutHistoryTab';
import MoaiRunDashboard from '@/components/client/MoaiRunDashboard';
import { Button } from '@/components/ui/button';
import { PlusCircle, Armchair, ListTodo, History } from 'lucide-react';
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

const WorkoutsPage = () => {
  const [showRestDayDialog, setShowRestDayDialog] = useState(false);
  const [programType, setProgramType] = useState<'strength' | 'run'>('strength');
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { user } = useAuth();
  
  const isMainWorkoutsPage = location.pathname === "/client-dashboard/workouts";
  const isActiveOrCompleteWorkout = location.pathname.includes('/active/') || 
                                   location.pathname.includes('/complete/');
  
  // Fetch user's program type
  useEffect(() => {
    const fetchProgramType = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('client_profiles')
          .select('program_type')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching program type:', error);
          return;
        }
        
        if (data && data.program_type) {
          setProgramType(data.program_type as 'strength' | 'run');
        }
      } catch (error) {
        console.error('Exception fetching program type:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgramType();
  }, [user]);

  const handleLogRestDay = () => {
    logRestDay().then(() => {
      toast.success("Rest day logged successfully!");
      setShowRestDayDialog(false);
    }).catch((error) => {
      console.error("Error logging rest day:", error);
      toast.error("Failed to log rest day");
      setShowRestDayDialog(false);
    });
  };

  // If still loading, show a loading state
  if (isLoading && user) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For routes other than the main page, render the normal components
  if (!isMainWorkoutsPage) {
    return (
      <div className="w-full">
        <Routes>
          <Route path="active/:workoutCompletionId" element={<ActiveWorkout />} />
          <Route path="complete/:workoutCompletionId" element={<WorkoutComplete />} />
          <Route path="create" element={<CreateCustomWorkout />} />
          <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
          <Route path="one-off" element={<EnterOneOffWorkout />} />
          <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
        </Routes>
      </div>
    );
  }

  // If it's the main workouts page, show the appropriate content based on program type
  return (
    <div className="w-full">
      {programType === 'run' ? (
        // Moai Run dashboard
        <MoaiRunDashboard />
      ) : (
        // Moai Strength dashboard - existing code
        <Tabs defaultValue="active-workouts" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="active-workouts" className="flex-1 flex items-center justify-center gap-2">
              <ListTodo className="h-4 w-4" />
              <span>My Workouts</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 flex items-center justify-center gap-2">
              <History className="h-4 w-4" />
              <span>Workout History</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active-workouts">
            <WorkoutsList />
            
            <div className="mt-8 border-t pt-6">
              <Button asChild variant="outline" className="w-full mb-4 flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                <Link to="/client-dashboard/workouts/one-off">
                  <PlusCircle className="h-4 w-4" />
                  Enter Custom Workout
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full mb-4 flex items-center justify-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => setShowRestDayDialog(true)}
              >
                <Armchair className="h-4 w-4" />
                Log Rest Day
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <WorkoutHistoryTab />
          </TabsContent>
        </Tabs>
      )}
      
      <Dialog open={showRestDayDialog} onOpenChange={setShowRestDayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Armchair className="h-5 w-5 text-green-600" />
              <span>Log a Rest Day</span>
            </DialogTitle>
            <DialogDescription>
              Are you taking a well-deserved rest day today?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm">
              <h4 className="font-semibold text-green-700 mb-2">The Power of Rest & Recovery</h4>
              <p className="text-green-700 mb-3">
                Rest days are just as important as workout days in your fitness journey! They allow your muscles to repair and grow stronger, prevent burnout, and reduce injury risk.
              </p>
              <h4 className="font-semibold text-green-700 mb-2">Rest Day Recommendations:</h4>
              <ul className="list-disc pl-5 text-green-700 space-y-1">
                <li>Gentle stretching or yoga</li>
                <li>Short, relaxing walk</li>
                <li>Meditation or deep breathing exercises</li>
                <li>Adequate hydration</li>
                <li>Quality sleep (7-9 hours)</li>
                <li>Epsom salt bath for muscle relaxation</li>
                <li>Foam rolling or self-massage</li>
              </ul>
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
