
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import EnterOneOffWorkout from '@/components/client/EnterOneOffWorkout';
import WorkoutHistoryTab from '@/components/client/WorkoutHistoryTab';
import { Button } from '@/components/ui/button';
import { ListTodo, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentProgram } from '@/services/program-service';

const WorkoutsPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  console.log("WorkoutsPage: Component rendering with path:", location.pathname);
  
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

  useEffect(() => {
    console.log("WorkoutsPage: Auth state changed, user:", user?.id);
  }, [user]);
  
  console.log("WorkoutsPage: About to render routes");
  
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
    </div>
  );
};

export default WorkoutsPage;
