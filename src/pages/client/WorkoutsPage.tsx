
import React from 'react';
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
import LogRunPage from './LogRunPage';
import LogCardioPage from './LogCardioPage';
import LogRestPage from './LogRestPage';

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

  // Enhanced key generation to ensure component fully remounts
  const timestamp = Date.now();
  const workoutCompletionId = location.pathname.split('/').pop();
  const forceReloadKey = `${workoutCompletionId}-${timestamp}-${user?.id || 'no-user'}-${Math.random().toString(36).substring(7)}`;

  return (
    <div className="w-full">
      <Routes>
        <Route index element={<WorkoutsList />} />
        <Route 
          path="active/:workoutCompletionId" 
          element={
            <ActiveWorkout 
              key={`active-${forceReloadKey}`} 
            />
          } 
        />
        <Route 
          path="complete/:workoutCompletionId" 
          element={
            <WorkoutComplete 
              key={`complete-${forceReloadKey}`} 
            />
          } 
        />
        <Route path="create" element={<CreateCustomWorkout />} />
        <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
        <Route 
          path="one-off" 
          element={
            <EnterOneOffWorkout 
              key={`one-off-${forceReloadKey}`} 
            />
          } 
        />
        <Route path="log-run" element={<LogRunPage />} />
        <Route path="log-cardio" element={<LogCardioPage />} />
        <Route path="log-rest" element={<LogRestPage />} />
        <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
      </Routes>
    </div>
  );
};

export default WorkoutsPage;
