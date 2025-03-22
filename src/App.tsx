
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClientLayout } from './layouts/ClientLayout';
import CustomWorkoutDetail from './components/client/CustomWorkoutDetail';
import CustomWorkoutActiveView from './components/client/CustomWorkoutActiveView';
import WorkoutsList from './components/client/WorkoutsList';
import ActiveWorkout from './components/client/ActiveWorkout';
import WorkoutComplete from './components/client/WorkoutComplete';
import CreateCustomWorkout from './components/client/CreateCustomWorkout';
import { NotFound } from './components/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkoutsList />} />
      
      {/* Client Dashboard Routes */}
      <Route path="/client-dashboard" element={<ClientLayout><WorkoutsList /></ClientLayout>} />
      <Route path="/client-dashboard/workouts" element={<ClientLayout><WorkoutsList /></ClientLayout>} />
      <Route path="/client-dashboard/workouts/custom/create" element={<ClientLayout><CreateCustomWorkout /></ClientLayout>} />
      <Route path="/client-dashboard/workouts/custom/:workoutId" element={<ClientLayout><CustomWorkoutDetail /></ClientLayout>} />
      <Route path="/client-dashboard/workouts/custom/:workoutId/active" element={<ClientLayout><CustomWorkoutActiveView /></ClientLayout>} />
      <Route path="/client-dashboard/workouts/active/:workoutCompletionId" element={<ClientLayout><ActiveWorkout /></ClientLayout>} />
      <Route path="/client-dashboard/workouts/complete/:workoutCompletionId" element={<ClientLayout><WorkoutComplete /></ClientLayout>} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
