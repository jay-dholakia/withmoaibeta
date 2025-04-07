
import React from 'react';
import {
  Route,
  Routes,
  Navigate,
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
import CoachLogin from './pages/CoachLogin';
import ClientLogin from './pages/ClientLogin';
import AdminLogin from './pages/AdminLogin';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

function App() {
  const { user, userType, loading } = useAuth();
  console.log("App: Rendering with auth state:", { user: user?.id, userType, loading });
  
  // Show a loading indicator while the auth state is being initialized
  if (loading) {
    console.log("App: Still initializing auth state...");
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
        <span className="ml-3">Loading authentication...</span>
      </div>
    );
  }

  console.log("App: Auth initialized, setting up routes");
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      
      {/* Auth Routes */}
      <Route path="/admin" element={user ? (userType === 'admin' ? <Navigate to="/admin-dashboard" /> : <Navigate to="/" />) : <AdminLogin />} />
      <Route path="/coach" element={user ? (userType === 'coach' ? <Navigate to="/coach-dashboard" /> : <Navigate to="/" />) : <CoachLogin />} />
      <Route path="/client" element={user ? (userType === 'client' ? <Navigate to="/client-dashboard" /> : <Navigate to="/" />) : <ClientLogin />} />
      
      {/* Client Routes */}
      <Route path="/client-dashboard/*" element={<RequireAuth allowedUserTypes={['client']} />}>
        <Route index element={<ClientDashboard />} />
        <Route path="*" element={<ClientDashboard />} />
      </Route>

      {/* Coach Routes */}
      <Route path="/coach-dashboard" element={<RequireAuth allowedUserTypes={['coach']} />}>
        <Route index element={<CoachDashboard />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:clientId" element={<Navigate to="/coach-dashboard/clients" />} />
        <Route path="workouts" element={<WorkoutProgramsPage />} />
        <Route path="workouts/create" element={<CreateWorkoutProgramPage />} />
        <Route path="workouts/:programId" element={<WorkoutProgramDetailPage />} />
        <Route path="workouts/:programId/edit" element={<EditProgramPage />} />
        <Route path="workouts/:programId/assign" element={<AssignProgramPage />} />
        <Route path="workouts/assign" element={<AssignProgramPage />} />
        <Route path="workout-templates" element={<StandaloneWorkoutsPage />} />
      </Route>

      {/* Fallback for unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
