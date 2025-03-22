
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import PassCounter from '@/components/client/PassCounter';
import LifeHappensButton from '@/components/client/LifeHappensButton';

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
        <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
      </Routes>
      
      {window.location.pathname === "/client-dashboard/workouts" && (
        <div className="px-4 sm:px-6">
          <LifeHappensButton />
        </div>
      )}
    </>
  );
};

export default WorkoutsPage;
