import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ClientDashboard from './pages/client/ClientDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import InvitationsPage from './pages/admin/InvitationsPage';
import GroupsPage from './pages/admin/GroupsPage';
import ClientsPage from './pages/admin/ClientsPage';
import CoachesPage from './pages/admin/CoachesPage';
import GroupDetailsPage from './pages/admin/GroupDetailsPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import CoachProfilePage from './pages/coach/CoachProfilePage';
import ExerciseManagementPage from './pages/admin/ExerciseManagementPage';
import WorkoutProgramPage from './pages/coach/WorkoutProgramPage';
import WorkoutProgramDetailsPage from './pages/coach/WorkoutProgramDetailsPage';
import WorkoutWeekDetailsPage from './pages/coach/WorkoutWeekDetailsPage';
import WorkoutDetailsPage from './pages/coach/WorkoutDetailsPage';
import ClientWorkoutHistoryPage from './pages/client/ClientWorkoutHistoryPage';
import ClientWorkoutDetailsPage from './pages/client/ClientWorkoutDetailsPage';
import ExerciseImportPage from './pages/admin/ExerciseImportPage';
import StandaloneWorkoutPage from './pages/coach/StandaloneWorkoutPage';
import StandaloneWorkoutDetailsPage from './pages/coach/StandaloneWorkoutDetailsPage';
import PublicRoute from './components/PublicRoute';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import CoachRoute from './components/CoachRoute';
import ClientRoute from './components/ClientRoute';
import ClientStatsPage from './pages/admin/ClientStatsPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/password-reset-request" element={<PublicRoute><PasswordResetRequestPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

          {/* Admin routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard/invitations" element={<InvitationsPage />} />
          <Route path="/admin-dashboard/groups" element={<GroupsPage />} />
          <Route path="/admin-dashboard/clients" element={<ClientsPage />} />
          <Route path="/admin-dashboard/coaches" element={<CoachesPage />} />
          <Route path="/admin-dashboard/groups/:groupId" element={<GroupDetailsPage />} />
          <Route path="/admin-dashboard/exercise-management" element={<ExerciseManagementPage />} />
          <Route path="/admin-dashboard/client-stats" element={<ClientStatsPage />} />
          <Route path="/exercise-import" element={<ExerciseImportPage />} />

          {/* Coach routes */}
          <Route path="/coach-dashboard" element={<CoachDashboard />} />
          <Route path="/coach-profile" element={<CoachProfilePage />} />
          <Route path="/workout-programs" element={<WorkoutProgramPage />} />
          <Route path="/workout-programs/:programId" element={<WorkoutProgramDetailsPage />} />
          <Route path="/workout-weeks/:weekId" element={<WorkoutWeekDetailsPage />} />
          <Route path="/workouts/:workoutId" element={<WorkoutDetailsPage />} />
          <Route path="/standalone-workouts" element={<StandaloneWorkoutPage />} />
          <Route path="/standalone-workouts/:workoutId" element={<StandaloneWorkoutDetailsPage />} />

          {/* Client routes */}
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/client-profile" element={<ClientProfilePage />} />
          <Route path="/client-workout-history" element={<ClientWorkoutHistoryPage />} />
          <Route path="/client-workout-history/:workoutId" element={<ClientWorkoutDetailsPage />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
