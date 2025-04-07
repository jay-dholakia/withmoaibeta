
import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import ClientsPage from './pages/coach/ClientsPage';
import WorkoutProgramsPage from './pages/coach/WorkoutProgramsPage';
import CreateWorkoutProgramPage from './pages/coach/CreateWorkoutProgramPage';
import WorkoutProgramDetailPage from './pages/coach/WorkoutProgramDetailPage';
import EditProgramPage from './pages/coach/EditProgramPage';
import ProgramAssignmentPage from './pages/coach/ProgramAssignmentPage';
import StandaloneWorkoutsPage from './pages/coach/StandaloneWorkoutsPage';
import ClientDashboard from './pages/client/ClientDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import AssignProgramPage from './pages/coach/AssignProgramPage';
import ClientProfilePage from './pages/coach/ClientProfilePage';

function App() {
  const { user, loading: authInitialized } = useAuth();

  // Show a loading indicator while the auth state is being initialized
  if (!authInitialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/coach-dashboard" />} />

        {/* Client Routes */}
        <Route path="/client-dashboard" element={<RequireAuth allowedUserTypes={['client']} />}>
          <Route index element={<ClientDashboard />} />
          {/* Add more client routes when pages are available */}
        </Route>

        {/* Coach Routes */}
        <Route path="/coach-dashboard" element={<RequireAuth allowedUserTypes={['coach']} />}>
          <Route index element={<CoachDashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:clientId" element={<ClientProfilePage />} />
          <Route path="workouts" element={<WorkoutProgramsPage />} />
          <Route path="workouts/create" element={<CreateWorkoutProgramPage />} />
          <Route path="workouts/:programId" element={<WorkoutProgramDetailPage />} />
          <Route path="workouts/:programId/edit" element={<EditProgramPage />} />
          <Route path="workouts/:programId/assign" element={<AssignProgramPage />} />
          <Route path="workouts/assign" element={<AssignProgramPage />} />
          <Route path="workout-templates" element={<StandaloneWorkoutsPage />} />
        </Route>

        {/* Redirect all unknown routes to the coach dashboard */}
        <Route path="*" element={<Navigate to="/coach-dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
