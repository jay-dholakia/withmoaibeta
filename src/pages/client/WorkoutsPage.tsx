
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import EnterOneOffWorkout from '@/components/client/EnterOneOffWorkout';
import LogRunPage from '@/pages/client/LogRunPage';
import LogCardioPage from '@/pages/client/LogCardioPage';
import LogRestDayPage from '@/pages/client/LogRestDayPage';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentProgram } from '@/services/program-service';
import NotFound from '@/pages/NotFound';
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Loading fallback component
const LoadingFallback = () => (
  <div className="w-full p-4">
    <Skeleton className="h-8 w-1/3 mb-6" />
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-md" />
      <Skeleton className="h-32 w-full rounded-md" />
      <Skeleton className="h-32 w-full rounded-md" />
    </div>
  </div>
);

const WorkoutsPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  console.log("WorkoutsPage: Component rendering with path:", location.pathname);
  
  const { data: currentProgram } = useQuery({
    queryKey: ['current-program', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await fetchCurrentProgram(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes before refetching
    gcTime: 1000 * 60 * 10, // 10 minutes before garbage collection
  });

  return (
    <div className="w-full">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route index element={<WorkoutsList />} />
          <Route path="active/:workoutCompletionId" element={<ActiveWorkout />} />
          <Route path="complete/:workoutCompletionId" element={<WorkoutComplete />} />
          <Route path="create" element={<CreateCustomWorkout />} />
          <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
          <Route path="one-off" element={<EnterOneOffWorkout />} />
          <Route path="log-run" element={<LogRunPage />} />
          <Route path="log-cardio" element={<LogCardioPage />} />
          <Route path="log-rest" element={<LogRestDayPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default WorkoutsPage;
