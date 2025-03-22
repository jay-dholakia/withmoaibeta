
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WorkoutsList from '../../components/client/WorkoutsList';
import ActiveWorkout from '../../components/client/ActiveWorkout';
import WorkoutComplete from '../../components/client/WorkoutComplete';
import CreateCustomWorkout from '../../components/client/CreateCustomWorkout';
import CustomWorkoutDetail from '../../components/client/CustomWorkoutDetail';
import CustomWorkoutActiveView from '../../components/client/CustomWorkoutActiveView';

const WorkoutsPage = () => {
  return (
    <Routes>
      <Route index element={<WorkoutsList />} />
      <Route path="active/:workoutCompletionId" element={<ActiveWorkout />} />
      <Route path="complete/:workoutCompletionId" element={<WorkoutComplete />} />
      <Route path="custom/create" element={<CreateCustomWorkout />} />
      <Route path="custom/:workoutId" element={<CustomWorkoutDetail />} />
      <Route path="custom/:workoutId/active" element={<CustomWorkoutActiveView />} />
      <Route path="*" element={<Navigate to="/client-dashboard/workouts" replace />} />
    </Routes>
  );
};

export default WorkoutsPage;
