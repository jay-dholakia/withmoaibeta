
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WorkoutsList from '@/components/client/WorkoutsList';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';

const WorkoutsPage = () => {
  console.log("WorkoutsPage component rendering");
  return (
    <Routes>
      <Route index element={<WorkoutsList />} />
      <Route path="active/:workoutCompletionId" element={<ActiveWorkout />} />
      <Route path="complete/:workoutCompletionId" element={<WorkoutComplete />} />
      <Route path="create" element={<CreateCustomWorkout />} />
      <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
      <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
    </Routes>
  );
};

export default WorkoutsPage;
