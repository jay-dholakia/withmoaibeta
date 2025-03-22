
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClientLayout } from './layouts/ClientLayout';
import { CoachLayout } from './layouts/CoachLayout';
import { NotFound } from './components/NotFound';
import ClientDashboard from './pages/client/ClientDashboard';
import WorkoutsList from './components/client/WorkoutsList';
import CustomWorkoutDetail from './components/client/CustomWorkoutDetail';
import CustomWorkoutActiveView from './components/client/CustomWorkoutActiveView';
import CreateCustomWorkout from './components/client/CreateCustomWorkout';
import ActiveWorkout from './components/client/ActiveWorkout';
import WorkoutComplete from './components/client/WorkoutComplete';

function App() {
  return (
    <Routes>
      {/* Redirect root to client dashboard */}
      <Route path="/" element={<WorkoutsList />} />
      
      {/* Client Dashboard Routes */}
      <Route path="/client-dashboard" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
      
      {/* Coach Dashboard Routes */}
      <Route path="/coach-dashboard/*" element={<CoachLayout><Routes>
        <Route index element={<div>Coach Dashboard</div>} />
        <Route path="*" element={<NotFound />} />
      </Routes></CoachLayout>} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
