
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import PassCounter from '@/components/client/PassCounter';
import EnterOneOffWorkout from '@/components/client/EnterOneOffWorkout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomWorkoutsList from '@/components/client/CustomWorkoutsList';
import { CalendarCheck, CalendarClock, Dumbbell } from 'lucide-react';

const WorkoutsPage = () => {
  console.log("WorkoutsPage component rendering");
  
  return (
    <>
      <div className="flex justify-end mb-4">
        <PassCounter />
      </div>
      
      <Routes>
        <Route index element={
          <div className="space-y-6">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  <span>Pending</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  <span>Completed</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                <WorkoutsList showCompleted={false} />
              </TabsContent>
              
              <TabsContent value="completed">
                <WorkoutsList showCompleted={true} />
              </TabsContent>
            </Tabs>
            
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-client" />
                Custom Workouts
              </h2>
              <CustomWorkoutsList />
            </div>
          </div>
        } />
        <Route path="active/:workoutCompletionId" element={<ActiveWorkout />} />
        <Route path="complete/:workoutCompletionId" element={<WorkoutComplete />} />
        <Route path="create" element={<CreateCustomWorkout />} />
        <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
        <Route path="one-off" element={<EnterOneOffWorkout />} />
        <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
      </Routes>
    </>
  );
};

export default WorkoutsPage;
