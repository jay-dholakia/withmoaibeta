
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import EnterOneOffWorkout from '@/components/client/EnterOneOffWorkout';
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
        <Route index element={<WorkoutsList />} />
        <Route path="active/:workoutCompletionId" element={<ActiveWorkout />} />
        <Route path="complete/:workoutCompletionId" element={<WorkoutComplete />} />
        <Route path="create" element={<CreateCustomWorkout />} />
        <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
        <Route path="one-off" element={<EnterOneOffWorkout />} />
        <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
      </Routes>
    </div>
  );
};

export default WorkoutsPage;
