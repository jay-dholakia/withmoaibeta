
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/ClientLogin'; // Fixed path
import PasswordResetRequestPage from './pages/client/PasswordResetRequestPage';
import ResetPasswordPage from './pages/ResetPassword'; // Fixed path
import RegisterPage from './pages/Register'; // Fixed path
import HomePage from './pages/Index'; // Fixed path
import ClientDashboard from './pages/client/ClientDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import InvitationsPage from './pages/admin/InvitationsPage';
import GroupsPage from './pages/admin/GroupsPage';
import ClientsPage from './pages/admin/ClientsPage';
import CoachesPage from './pages/admin/CoachesPage';
import GroupDetailsPage from './pages/admin/GroupDetailsPage';
import ClientProfilePage from './pages/client/ProfileEditor'; // Fixed path
import CoachProfilePage from './pages/coach/ProfilePage'; // Fixed path
import ExerciseManagementPage from './pages/admin/ExerciseManagementPage';
import WorkoutProgramPage from './pages/coach/WorkoutProgramsPage'; // Fixed path
import WorkoutProgramDetailsPage from './pages/coach/WorkoutProgramDetailPage'; // Fixed path
import WorkoutWeekDetailsPage from './pages/coach/WorkoutWeekDetailPage'; // Fixed path
import WorkoutDetailsPage from './pages/coach/EditWorkoutPage'; // Fixed path
import ClientWorkoutHistoryPage from './pages/client/WorkoutsPage'; // Fixed path
import ClientWorkoutDetailsPage from './pages/client/WorkoutDetailsPage'; // Fixed path
import ExerciseImportPage from './pages/ExerciseImportPage'; // Fixed path
import StandaloneWorkoutPage from './pages/coach/StandaloneWorkoutsPage'; // Fixed path
import StandaloneWorkoutDetailsPage from './pages/coach/StandaloneWorkoutDetailsPage';
import PublicRoute from './components/PublicRoute';
import AdminRoute from './components/AdminRoute';
import CoachRoute from './components/CoachRoute';
import ClientRoute from './components/ClientRoute';
import ClientStatsPage from './pages/admin/ClientStatsPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
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
        <Route path="/admin-dashboard/exercise-management" element={<AdminRoute><ExerciseManagementPage /></AdminRoute>} />
        <Route path="/admin-dashboard/client-stats" element={<AdminRoute><ClientStatsPage /></AdminRoute>} />
        <Route path="/exercise-import" element={<AdminRoute><ExerciseImportPage /></AdminRoute>} />

        {/* Coach routes */}
        <Route path="/coach-dashboard" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
        <Route path="/coach-profile" element={<CoachRoute><CoachProfilePage /></CoachRoute>} />
        <Route path="/workout-programs" element={<CoachRoute><WorkoutProgramPage /></CoachRoute>} />
        <Route path="/workout-programs/:programId" element={<CoachRoute><WorkoutProgramDetailsPage /></CoachRoute>} />
        <Route path="/workout-weeks/:weekId" element={<CoachRoute><WorkoutWeekDetailsPage /></CoachRoute>} />
        <Route path="/workouts/:workoutId" element={<CoachRoute><WorkoutDetailsPage /></CoachRoute>} />
        <Route path="/standalone-workouts" element={<CoachRoute><StandaloneWorkoutPage /></CoachRoute>} />
        <Route path="/standalone-workouts/:workoutId" element={<CoachRoute><StandaloneWorkoutDetailsPage /></CoachRoute>} />

        {/* Client routes */}
        <Route path="/client-dashboard/*" element={<ClientRoute><ClientDashboard /></ClientRoute>} />
        <Route path="/client-profile" element={<ClientRoute><ClientProfilePage /></ClientRoute>} />
        <Route path="/client-workout-history" element={<ClientRoute><ClientWorkoutHistoryPage /></ClientRoute>} />
        <Route path="/client-workout-history/:workoutId" element={<ClientRoute><ClientWorkoutDetailsPage /></ClientRoute>} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
