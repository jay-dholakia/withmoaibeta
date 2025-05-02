
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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

// Storage key for the last visited workout page
const LAST_WORKOUT_PATH_KEY = 'last_workout_path';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log("WorkoutsPage: Component rendering with path:", location.pathname);
  
  // Store the current path whenever it changes
  useEffect(() => {
    // Only store non-dynamic paths (don't store specific workout IDs)
    // This prevents redirecting to potentially completed/expired workouts
    if (location.pathname === '/client-dashboard/workouts' ||
        location.pathname === '/client-dashboard/workouts/create' ||
        location.pathname === '/client-dashboard/workouts/one-off' ||
        location.pathname === '/client-dashboard/workouts/log-run' ||
        location.pathname === '/client-dashboard/workouts/log-cardio' ||
        location.pathname === '/client-dashboard/workouts/log-rest') {
      localStorage.setItem(LAST_WORKOUT_PATH_KEY, location.pathname);
      console.log("WorkoutsPage: Saved path to localStorage:", location.pathname);
    }
    
    // For active workouts, save the full path including ID
    if (location.pathname.includes('/active/') || 
        location.pathname.includes('/complete/') || 
        location.pathname.includes('/custom/')) {
      localStorage.setItem(LAST_WORKOUT_PATH_KEY, location.pathname);
      console.log("WorkoutsPage: Saved workout path to localStorage:", location.pathname);
    }
  }, [location.pathname]);
  
  // On initial load, check if we should redirect
  useEffect(() => {
    // Only redirect if we're at the root workouts page
    if (location.pathname === '/client-dashboard/workouts') {
      const lastPath = localStorage.getItem(LAST_WORKOUT_PATH_KEY);
      
      // Only navigate if there's a saved path that's different from current
      if (lastPath && lastPath !== location.pathname) {
        console.log("WorkoutsPage: Navigating to last path:", lastPath);
        navigate(lastPath, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

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
