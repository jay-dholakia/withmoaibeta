import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserDashboard from './pages/user/UserDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import RequireAuth from './components/RequireAuth';
import ClientsPage from './pages/coach/ClientsPage';
import WorkoutProgramsPage from './pages/coach/WorkoutProgramsPage';
import CreateWorkoutProgramPage from './pages/coach/CreateWorkoutProgramPage';
import WorkoutProgramDetailPage from './pages/coach/WorkoutProgramDetailPage';
import EditProgramPage from './pages/coach/EditProgramPage';
import ProgramAssignmentPage from './pages/coach/ProgramAssignmentPage';
import StandaloneWorkoutsPage from './pages/coach/StandaloneWorkoutsPage';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientProgramsPage from './pages/client/ClientProgramsPage';
import ClientProgramDetailsPage from './pages/client/ClientProgramDetailsPage';
import ClientSettingsPage from './pages/client/ClientSettingsPage';
import EditWorkoutPage from './pages/coach/EditWorkoutPage';
import CreateWorkoutPage from './pages/coach/CreateWorkoutPage';
import EditExercisePage from './pages/coach/EditExercisePage';
import CreateExercisePage from './pages/coach/CreateExercisePage';
import ExercisesPage from './pages/coach/ExercisesPage';
import EditWorkoutWeekPage from './pages/coach/EditWorkoutWeekPage';
import CreateWorkoutWeekPage from './pages/coach/CreateWorkoutWeekPage';
import EditStandaloneWorkoutPage from './pages/coach/EditStandaloneWorkoutPage';
import CreateStandaloneWorkoutPage from './pages/coach/CreateStandaloneWorkoutPage';
import ClientMetricsPage from './pages/coach/ClientMetricsPage';
import ClientProfilePage from './pages/coach/ClientProfilePage';
import AssignProgramPage from './pages/coach/AssignProgramPage';

function App() {
  const { authInitialized } = useAuth();

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
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* User Routes */}
        <Route path="/user-dashboard" element={<RequireAuth allowedUserTypes={['user', 'coach']} />}>
          <Route index element={<UserDashboard />} />
        </Route>

        {/* Client Routes */}
        <Route path="/client-dashboard" element={<RequireAuth allowedUserTypes={['client']} />}>
          <Route index element={<ClientDashboard />} />
          <Route path="programs" element={<ClientProgramsPage />} />
          <Route path="programs/:programId" element={<ClientProgramDetailsPage />} />
          <Route path="settings" element={<ClientSettingsPage />} />
        </Route>

        {/* Coach Routes */}
        <Route path="/coach-dashboard" element={<RequireAuth allowedUserTypes={['coach']} />}>
          <Route index element={<CoachDashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:clientId" element={<ClientProfilePage />} />
          <Route path="clients/:clientId/metrics" element={<ClientMetricsPage />} />
          <Route path="workouts" element={<WorkoutProgramsPage />} />
          <Route path="workouts/create" element={<CreateWorkoutProgramPage />} />
          <Route path="workouts/:programId" element={<WorkoutProgramDetailPage />} />
          <Route path="workouts/:programId/edit" element={<EditProgramPage />} />
          <Route path="workouts/:programId/assign" element={<AssignProgramPage />} />
          <Route path="workouts/assign" element={<AssignProgramPage />} />
          <Route path="workouts/:programId/weeks/:weekId/edit" element={<EditWorkoutWeekPage />} />
          <Route path="workouts/:programId/weeks/create" element={<CreateWorkoutWeekPage />} />
          <Route path="workouts/:programId/weeks/:weekId/workouts/:workoutId/edit" element={<EditWorkoutPage />} />
          <Route path="workouts/:programId/weeks/:weekId/workouts/create" element={<CreateWorkoutPage />} />
          <Route path="workout-templates" element={<StandaloneWorkoutsPage />} />
          <Route path="workout-templates/create" element={<CreateStandaloneWorkoutPage />} />
          <Route path="workout-templates/:workoutId/edit" element={<EditStandaloneWorkoutPage />} />
          <Route path="exercises" element={<ExercisesPage />} />
          <Route path="exercises/create" element={<CreateExercisePage />} />
          <Route path="exercises/:exerciseId/edit" element={<EditExercisePage />} />
        </Route>

        {/* Redirect all unknown routes to the login page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
