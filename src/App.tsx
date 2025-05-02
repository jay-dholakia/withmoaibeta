import React, { useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AdminToolsProvider } from './contexts/AdminToolsContext';
import LoginPage from './pages/ClientLogin'; 
import CoachLogin from './pages/CoachLogin';
import AdminLogin from './pages/AdminLogin';
import PasswordResetRequestPage from './pages/client/PasswordResetRequestPage';
import ResetPasswordPage from './pages/ResetPassword';
import RegisterPage from './pages/Register';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/Index';
import ClientDashboard from './pages/client/ClientDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminToolsPage from './pages/admin/AdminToolsPage';
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
import WorkoutExercisesPage from './pages/coach/WorkoutExercisesPage';
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
import CoachClientStatsPage from './pages/coach/ClientStatsPage';
import CreateWorkoutWeekPage from './pages/coach/CreateWorkoutWeekPage';
import CreateWorkoutProgramPage from './pages/coach/CreateWorkoutProgramPage';
import AssignProgramPage from './pages/coach/AssignProgramPage';
import CoachClientsPage from './pages/coach/ClientsPage';
import PrivacyPolicyPage from './pages/client/PrivacyPolicyPage';
import TermsOfServicePage from './pages/client/TermsOfServicePage';
import LiveRunPage from './pages/client/LiveRunPage';
import ProfileBuilder from './pages/client/ProfileBuilder';
import NotFound from './pages/NotFound';

// Storage key for last client dashboard location
const LAST_APP_PATH_KEY = 'last_app_path';

const App: React.FC = () => {
  const { authLoading, user } = useAuth();
  const location = useLocation();

  // Remember the last path the user was on
  useEffect(() => {
    // Only save meaningful paths that aren't login/register related
    if (!location.pathname.includes('login') &&
        !location.pathname.includes('register') &&
        !location.pathname.includes('reset') &&
        !location.pathname.includes('portals') &&
        location.pathname !== '/' &&
        location.pathname !== '/landing') {
      
      localStorage.setItem(LAST_APP_PATH_KEY, location.pathname);
    }
  }, [location.pathname]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
        <span className="ml-3">Loading application...</span>
      </div>
    );
  }

  // Redirect to last path if logged in and going to root
  if (user && (location.pathname === '/' || location.pathname === '/portals')) {
    const lastPath = localStorage.getItem(LAST_APP_PATH_KEY);
    
    if (lastPath) {
      return <Navigate to={lastPath} replace />;
    }
    
    // Default paths for different user types
    if (user.app_metadata?.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.app_metadata?.role === 'coach') {
      return <Navigate to="/coach-dashboard" replace />;
    } else {
      return <Navigate to="/client-dashboard/moai" replace />;
    }
  }

  return (
    <AdminToolsProvider>
      <Routes>
        {/* Root redirects to portals page */}
        <Route path="/" element={<Navigate to="/portals" replace />} />
        
        {/* Keep landing page available as a separate route */}
        <Route path="/landing" element={<PublicRoute><LandingPage /></PublicRoute>} />
        
        {/* Add portals page route using the HomePage component */}
        <Route path="/portals" element={<PublicRoute><HomePage /></PublicRoute>} />
        
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/coach-login" element={<PublicRoute><CoachLogin /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/password-reset-request" element={<PublicRoute><PasswordResetRequestPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/privacy-policy" element={<PublicRoute><PrivacyPolicyPage /></PublicRoute>} />
        <Route path="/terms-of-service" element={<PublicRoute><TermsOfServicePage /></PublicRoute>} />
        <Route path="/client-profile-builder" element={<ClientRoute><ProfileBuilder /></ClientRoute>} />

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

        {/* Hidden Admin Tools routes */}
        <Route path="/admin-tools" element={<AdminRoute><AdminToolsPage /></AdminRoute>} />
        <Route path="/admin-tools/*" element={<AdminRoute><AdminToolsPage /></AdminRoute>} />

        {/* Coach routes */}
        <Route path="/coach-dashboard" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
        <Route path="/coach-profile" element={<CoachRoute><CoachProfilePage /></CoachRoute>} />
        <Route path="/coach-dashboard/workouts" element={<CoachRoute><WorkoutProgramPage /></CoachRoute>} />
        <Route path="/coach-dashboard/workouts/create" element={<CoachRoute><CreateWorkoutProgramPage /></CoachRoute>} />
        <Route path="/coach-dashboard/workouts/:programId" element={<CoachRoute><WorkoutProgramDetailsPage /></CoachRoute>} />
        <Route path="/coach-dashboard/workouts/:programId/assign" element={<CoachRoute><AssignProgramPage /></CoachRoute>} />
        <Route path="/coach-dashboard/workouts/week/:weekId" element={<CoachRoute><WorkoutWeekDetailsPage /></CoachRoute>} />
        <Route path="/coach-dashboard/workouts/:programId/create-week" element={<CoachRoute><CreateWorkoutWeekPage /></CoachRoute>} />
        <Route path="/workout-weeks/:weekId" element={<CoachRoute><WorkoutWeekDetailsPage /></CoachRoute>} />
        <Route path="/workouts/:workoutId/edit" element={<CoachRoute><EditWorkoutPage /></CoachRoute>} />
        <Route path="/workouts/:workoutId/exercises" element={<CoachRoute><WorkoutExercisesPage /></CoachRoute>} />
        <Route path="/coach-dashboard/standalone-workouts" element={<CoachRoute><StandaloneWorkoutPage /></CoachRoute>} />
        <Route path="/coach-dashboard/standalone-workouts/:workoutId" element={<CoachRoute><StandaloneWorkoutDetailsPage /></CoachRoute>} />
        <Route path="/coach-dashboard/workout-templates" element={<CoachRoute><StandaloneWorkoutPage /></CoachRoute>} />
        <Route path="/coach-dashboard/exercise-management" element={<CoachRoute><CoachExerciseManagementPage /></CoachRoute>} />
        <Route path="/coach-dashboard/clients" element={<CoachRoute><CoachClientsPage /></CoachRoute>} />
        <Route path="/coach-dashboard/client-stats" element={<CoachRoute><CoachClientStatsPage /></CoachRoute>} />

        {/* Client routes */}
        <Route path="/client" element={<Navigate to="/client-dashboard/moai" replace />} />
        
        <Route path="/dashboard" element={<ClientRoute><ClientDashboard /></ClientRoute>} />
        <Route path="/client-dashboard/*" element={<ClientRoute><ClientDashboard /></ClientRoute>} />
        <Route path="/client-dashboard/workouts/live-run" element={<ClientRoute><LiveRunPage /></ClientRoute>} />
        
        <Route path="/client-profile-editor" element={<Navigate to="/client-dashboard/settings/edit-profile" replace />} />
        
        <Route path="/profile" element={<ClientRoute><ClientProfilePage /></ClientRoute>} />
        <Route path="/workouts" element={<ClientRoute><ClientWorkoutHistoryPage /></ClientRoute>} />
        <Route path="/workouts/:workoutId" element={<ClientRoute><ClientWorkoutDetailsPage /></ClientRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AdminToolsProvider>
  );
};

export default App;
