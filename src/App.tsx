
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import PublicRoute from './components/PublicRoute';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import CoachRoute from './components/CoachRoute';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import ClientLogin from './pages/ClientLogin';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientDashboard from './pages/client/ClientDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import CoachLogin from './pages/CoachLogin';
import ClientsPage from './pages/coach/ClientsPage';
import ClientStatsPage from './pages/coach/ClientStatsPage';
import WorkoutProgramsPage from './pages/coach/WorkoutProgramsPage';
import WorkoutProgramDetailPage from './pages/coach/WorkoutProgramDetailPage';
import CreateWorkoutProgramPage from './pages/coach/CreateWorkoutProgramPage';
import EditWorkoutPage from './pages/coach/EditWorkoutPage';
import WorkoutExercisesPage from './pages/coach/WorkoutExercisesPage';
import WorkoutWeekDetailPage from './pages/coach/WorkoutWeekDetailPage';
import ProgramDetailPage from './pages/coach/ProgramDetailPage';
import StandaloneWorkoutsPage from './pages/coach/StandaloneWorkoutsPage';
import StandaloneWorkoutDetailsPage from './pages/coach/StandaloneWorkoutDetailsPage';
import LeaderboardPage from './pages/coach/LeaderboardPage';
import CreateWorkoutWeekPage from './pages/coach/CreateWorkoutWeekPage';
import ExerciseManagementPage from './pages/coach/ExerciseManagementPage';
import ProfilePage from './pages/coach/ProfilePage';
import EditProgramPage from './pages/coach/EditProgramPage';
import ProgramAssignmentPage from './pages/coach/ProgramAssignmentPage';
import AssignProgramPage from './pages/coach/AssignProgramPage';
import LandingPage from './pages/LandingPage';
import AdminSetup from './pages/AdminSetup';
import InvitationsPage from './pages/admin/InvitationsPage';
import GroupsPage from './pages/admin/GroupsPage';
import GroupDetailsPage from './pages/admin/GroupDetailsPage';
import CoachesPage from './pages/admin/CoachesPage';
import AdminClientsPage from './pages/admin/ClientsPage';
import AdminToolsPage from './pages/admin/AdminToolsPage';
import AdminClientStatsPage from './pages/admin/ClientStatsPage';
import AdminExerciseManagementPage from './pages/admin/ExerciseManagementPage';
import ProfileBuilder from './pages/client/ProfileBuilder';
import AIInsightsPage from './pages/coach/AIInsightsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/first-admin-setup" element={<PublicRoute><AdminSetup /></PublicRoute>} />
          <Route path="/client-login" element={<PublicRoute><ClientLogin /></PublicRoute>} />
          <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
          <Route path="/coach-login" element={<PublicRoute><CoachLogin /></PublicRoute>} />
          
          {/* Admin routes */}
          <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin-dashboard/invitations" element={<AdminRoute><InvitationsPage /></AdminRoute>} />
          <Route path="/admin-dashboard/groups" element={<AdminRoute><GroupsPage /></AdminRoute>} />
          <Route path="/admin-dashboard/group/:groupId" element={<AdminRoute><GroupDetailsPage /></AdminRoute>} />
          <Route path="/admin-dashboard/coaches" element={<AdminRoute><CoachesPage /></AdminRoute>} />
          <Route path="/admin-dashboard/clients" element={<AdminRoute><AdminClientsPage /></AdminRoute>} />
          <Route path="/admin-dashboard/client-stats" element={<AdminRoute><AdminClientStatsPage /></AdminRoute>} />
          <Route path="/admin-dashboard/exercise-management" element={<AdminRoute><AdminExerciseManagementPage /></AdminRoute>} />
          <Route path="/admin-tools" element={<AdminRoute><AdminToolsPage /></AdminRoute>} />
          
          {/* Client routes */}
          <Route path="/client-dashboard/*" element={<PrivateRoute><ClientDashboard /></PrivateRoute>} />
          <Route path="/profile-builder" element={<PrivateRoute><ProfileBuilder /></PrivateRoute>} />
          
          {/* Coach routes */}
          <Route path="/coach-dashboard" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
          <Route path="/coach-dashboard/clients" element={<CoachRoute><ClientsPage /></CoachRoute>} />
          <Route path="/coach-dashboard/client-stats" element={<CoachRoute><ClientStatsPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workouts" element={<CoachRoute><WorkoutProgramsPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workouts/:programId" element={<CoachRoute><WorkoutProgramDetailPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workouts/create" element={<CoachRoute><CreateWorkoutProgramPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workouts/:programId/edit" element={<CoachRoute><EditProgramPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workouts/:programId/weeks/:weekId" element={<CoachRoute><WorkoutWeekDetailPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workouts/:programId/weeks/:weekId/workouts/:workoutId" element={<CoachRoute><EditWorkoutPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workouts/:programId/weeks/:weekId/workouts/:workoutId/exercises" element={<CoachRoute><WorkoutExercisesPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workouts/:programId/weeks/create" element={<CoachRoute><CreateWorkoutWeekPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workout-templates" element={<CoachRoute><StandaloneWorkoutsPage /></CoachRoute>} />
          <Route path="/coach-dashboard/workout-templates/:workoutId" element={<CoachRoute><StandaloneWorkoutDetailsPage /></CoachRoute>} />
          <Route path="/coach-dashboard/programs/:programId" element={<CoachRoute><ProgramDetailPage /></CoachRoute>} />
          <Route path="/coach-dashboard/programs/assign" element={<CoachRoute><ProgramAssignmentPage /></CoachRoute>} />
          <Route path="/coach-dashboard/clients/:clientId/assign-program" element={<CoachRoute><AssignProgramPage /></CoachRoute>} />
          <Route path="/coach-dashboard/leaderboards" element={<CoachRoute><LeaderboardPage /></CoachRoute>} />
          <Route path="/coach-dashboard/exercise-management" element={<CoachRoute><ExerciseManagementPage /></CoachRoute>} />
          <Route path="/coach-dashboard/ai-insights" element={<CoachRoute><AIInsightsPage /></CoachRoute>} />
          <Route path="/coach-profile" element={<CoachRoute><ProfilePage /></CoachRoute>} />
          
          {/* Fallback routes */}
          <Route path="/index" element={<Navigate replace to="/" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
