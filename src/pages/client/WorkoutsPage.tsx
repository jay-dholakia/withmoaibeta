
import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import PassCounter from '@/components/client/PassCounter';
import LifeHappensButton from '@/components/client/LifeHappensButton';
import EnterOneOffWorkout from '@/components/client/EnterOneOffWorkout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Armchair } from 'lucide-react';
import { createOneOffWorkoutCompletion } from '@/services/workout-history-service';
import { toast } from 'sonner';

const WorkoutsPage = () => {
  console.log("WorkoutsPage component rendering");
  return (
    <>
      <div className="flex justify-end mb-4">
        <PassCounter />
      </div>
      
      <Routes>
        <Route index element={<WorkoutsList />} />
        <Route path="active/:workoutCompletionId" element={<ActiveWorkout />} />
        <Route path="complete/:workoutCompletionId" element={<WorkoutComplete />} />
        <Route path="create" element={<CreateCustomWorkout />} />
        <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
        <Route path="one-off" element={<EnterOneOffWorkout />} />
        <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
      </Routes>
      
      {window.location.pathname === "/client-dashboard/workouts" && (
        <div className="px-4 sm:px-6">
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
              onClick={() => {
                // Call the service function to log a rest day
                createOneOffWorkoutCompletion({
                  title: "Rest Day",
                  description: "Taking a scheduled rest day",
                }).then(() => {
                  toast.success("Rest day logged successfully!");
                }).catch((error) => {
                  console.error("Error logging rest day:", error);
                  toast.error("Failed to log rest day");
                });
              }}
            >
              <Armchair className="h-4 w-4" />
              Log Rest Day
            </Button>
          </div>
          <LifeHappensButton />
        </div>
      )}
    </>
  );
};

export default WorkoutsPage;
