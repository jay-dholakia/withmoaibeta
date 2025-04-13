import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/ClientLogin'; 
import CoachLogin from './pages/CoachLogin';
import AdminLogin from './pages/AdminLogin';
import PasswordResetRequestPage from './pages/client/PasswordResetRequestPage';
import ResetPasswordPage from './pages/ResetPassword';
import RegisterPage from './pages/Register';
import HomePage from './pages/Index';
import ClientDashboard from './pages/client/ClientDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import InvitationsPage from './pages/admin/InvitationsPage';
import GroupsPage from './pages/admin/GroupsPage';
import ClientsPage from './pages/admin/ClientsPage';
import CoachesPage from './pages/admin/CoachesPage';
import GroupDetailsPage from './pages/admin/GroupDetailsPage';
import ClientProfilePage from './pages/client/ProfileEditor';
import CoachProfilePage from './pages/coach/ProfilePage';
import AdminExerciseManagementPage from './pages/admin/ExerciseManagementPage';
import CoachExerciseManagementPage from './pages/coach/ExerciseManagementPage';
import WorkoutProgramPage from './pages/coach/WorkoutProgramsPage';
import WorkoutProgramDetailsPage from './pages/coach/WorkoutProgramDetailPage';
import WorkoutWeekDetailsPage from './pages/coach/WorkoutWeekDetailPage';
import WorkoutDetailsPage from './pages/coach/EditWorkoutPage';
import EditWorkoutPage from './pages/coach/EditWorkoutPage';
import ClientWorkoutHistoryPage from './pages/client/WorkoutsPage';
import ClientWorkoutDetailsPage from './pages/client/WorkoutDetailsPage';
import ExerciseImportPage from './pages/ExerciseImportPage';
import StandaloneWorkoutPage from './pages/coach/StandaloneWorkoutsPage';
import StandaloneWorkoutDetailsPage from './pages/coach/StandaloneWorkoutDetailsPage';
import PublicRoute from './components/PublicRoute';
import AdminRoute from './components/AdminRoute';
import CoachRoute from './components/CoachRoute';
import ClientRoute from './components/ClientRoute';
import ClientStatsPage from './pages/admin/ClientStatsPage';
import CreateWorkoutWeekPage from './pages/coach/CreateWorkoutWeekPage';

const App: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
        <span className="ml-3">Loading application...</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes accessible to everyone */}
      <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
      <Route path="/coach-login" element={<PublicRoute><CoachLogin /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/password-reset-request" element={<PublicRoute><PasswordResetRequestPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* Admin routes */}
      <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin-dashboard/invitations" element={<AdminRoute><InvitationsPage /></AdminRoute>} />
      <Route path="/admin-dashboard/groups" element={<AdminRoute><GroupsPage /></AdminRoute>} />
      <Route path="/admin-dashboard/clients" element={<AdminRoute><ClientsPage /></AdminRoute>} />
      <Route path="/admin-dashboard/coaches" element={<AdminRoute><CoachesPage /></AdminRoute>} />
      <Route path="/admin-dashboard/groups/:groupId" element={<AdminRoute><GroupDetailsPage /></AdminRoute>} />
      <Route path="/admin-dashboard/exercise-management" element={<AdminRoute><AdminExerciseManagementPage /></AdminRoute>} />
      <Route path="/admin-dashboard/client-stats" element={<AdminRoute><ClientStatsPage /></AdminRoute>} />
      <Route path="/exercise-import" element={<AdminRoute><ExerciseImportPage /></AdminRoute>} />

      {/* Coach routes */}
      <Route path="/coach-dashboard" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
      <Route path="/coach-profile" element={<CoachRoute><CoachProfilePage /></CoachRoute>} />
      <Route path="/coach-dashboard/workouts" element={<CoachRoute><WorkoutProgramPage /></CoachRoute>} />
      <Route path="/coach-dashboard/workouts/:programId" element={<CoachRoute><WorkoutProgramDetailsPage /></CoachRoute>} />
      <Route path="/workout-weeks/:weekId" element={<CoachRoute><WorkoutWeekDetailsPage /></CoachRoute>} />
      <Route path="/coach-dashboard/workouts/:programId/create-week" element={<CoachRoute><CreateWorkoutWeekPage /></CoachRoute>} />
      <Route path="/workouts/:workoutId" element={<CoachRoute><WorkoutDetailsPage /></CoachRoute>} />
      <Route path="/workouts/:workoutId/edit" element={<CoachRoute><EditWorkoutPage /></CoachRoute>} />
      <Route path="/coach-dashboard/workout-templates" element={<CoachRoute><StandaloneWorkoutPage /></CoachRoute>} />
      <Route path="/standalone-workouts/:workoutId" element={<CoachRoute><StandaloneWorkoutDetailsPage /></CoachRoute>} />
      <Route path="/coach-dashboard/exercise-management" element={<CoachRoute><CoachExerciseManagementPage /></CoachRoute>} />
      <Route path="/coach-dashboard/clients" element={<CoachRoute><ClientsPage /></CoachRoute>} />

      {/* Client routes */}
      <Route path="/client-dashboard/*" element={<ClientRoute><ClientDashboard /></ClientRoute>} />
      <Route path="/client-profile" element={<ClientRoute><ClientProfilePage /></ClientRoute>} />
      <Route path="/client-workout-history" element={<ClientRoute><ClientWorkoutHistoryPage /></ClientRoute>} />
      <Route path="/client-workout-history/:workoutId" element={<ClientRoute><ClientWorkoutDetailsPage /></ClientRoute>} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
