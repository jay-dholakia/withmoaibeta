
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

// Main pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ClientLogin from './pages/ClientLogin';
import CoachLogin from './pages/CoachLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import AdminSetup from './pages/AdminSetup';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CoachesPage from './pages/admin/CoachesPage';
import ClientsPage from './pages/admin/ClientsPage';
import GroupsPage from './pages/admin/GroupsPage';
import InvitationsPage from './pages/admin/InvitationsPage';
import GroupDetailsPage from './pages/admin/GroupDetailsPage';

// Coach pages
import CoachDashboard from './pages/coach/CoachDashboard';
import WorkoutProgramsPage from './pages/coach/WorkoutProgramsPage';
import CreateWorkoutProgramPage from './pages/coach/CreateWorkoutProgramPage';
import WorkoutProgramDetailPage from './pages/coach/WorkoutProgramDetailPage';
import ProgramAssignmentPage from './pages/coach/ProgramAssignmentPage';
import StandaloneWorkoutsPage from './pages/coach/StandaloneWorkoutsPage';
import LeaderboardPage from './pages/coach/LeaderboardPage';
import ProfilePage from './pages/coach/ProfilePage';
import CoachClientsPage from './pages/coach/ClientsPage';

// Client pages
import ClientDashboard from './pages/client/ClientDashboard';
import ProfileBuilder from './pages/client/ProfileBuilder';
import ClientWorkoutsPage from './pages/client/WorkoutsPage';
import ClientMoaiPage from './pages/client/MoaiPage';
import ClientLeaderboardPage from './pages/client/LeaderboardPage';
import ClientNotesPage from './pages/client/NotesPage';
import ProfileEditor from './pages/client/ProfileEditor';
import ClientSettingsPage from './pages/client/SettingsPage';

import './App.css';
import RequireAuth from './components/RequireAuth';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/client-login" element={<ClientLogin />} />
            <Route path="/coach-login" element={<CoachLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Admin routes */}
            <Route path="/admin-dashboard" element={
              <RequireAuth userType="admin">
                <AdminDashboard />
              </RequireAuth>
            } />
            <Route path="/admin-dashboard/coaches" element={
              <RequireAuth userType="admin">
                <CoachesPage />
              </RequireAuth>
            } />
            <Route path="/admin-dashboard/clients" element={
              <RequireAuth userType="admin">
                <ClientsPage />
              </RequireAuth>
            } />
            <Route path="/admin-dashboard/groups" element={
              <RequireAuth userType="admin">
                <GroupsPage />
              </RequireAuth>
            } />
            <Route path="/admin-dashboard/groups/:groupId" element={
              <RequireAuth userType="admin">
                <GroupDetailsPage />
              </RequireAuth>
            } />
            <Route path="/admin-dashboard/invitations" element={
              <RequireAuth userType="admin">
                <InvitationsPage />
              </RequireAuth>
            } />
            
            {/* Add redirect for /admin */}
            <Route path="/admin" element={<Navigate to="/admin-login" replace />} />
            
            {/* Coach routes */}
            <Route path="/coach-dashboard" element={
              <RequireAuth userType="coach">
                <CoachDashboard />
              </RequireAuth>
            } />
            <Route path="/coach-dashboard/workouts" element={
              <RequireAuth userType="coach">
                <WorkoutProgramsPage />
              </RequireAuth>
            } />
            <Route path="/coach-dashboard/workout-templates" element={
              <RequireAuth userType="coach">
                <StandaloneWorkoutsPage />
              </RequireAuth>
            } />
            <Route path="/coach-dashboard/workouts/create" element={
              <RequireAuth userType="coach">
                <CreateWorkoutProgramPage />
              </RequireAuth>
            } />
            <Route path="/coach-dashboard/workouts/:programId" element={
              <RequireAuth userType="coach">
                <WorkoutProgramDetailPage />
              </RequireAuth>
            } />
            <Route path="/coach-dashboard/workouts/:programId/assign" element={
              <RequireAuth userType="coach">
                <ProgramAssignmentPage />
              </RequireAuth>
            } />
            <Route path="/coach-dashboard/clients" element={
              <RequireAuth userType="coach">
                <CoachClientsPage />
              </RequireAuth>
            } />
            <Route path="/coach-dashboard/leaderboards" element={
              <RequireAuth userType="coach">
                <LeaderboardPage />
              </RequireAuth>
            } />
            <Route path="/coach-dashboard/profile" element={
              <RequireAuth userType="coach">
                <ProfilePage />
              </RequireAuth>
            } />
            
            {/* Add redirect for /coach */}
            <Route path="/coach" element={<Navigate to="/coach-login" replace />} />
            
            {/* Client routes */}
            <Route path="/client-dashboard/*" element={
              <RequireAuth userType="client">
                <ClientDashboard />
              </RequireAuth>
            } />
            <Route path="/client-dashboard/profile-builder" element={
              <RequireAuth userType="client">
                <ProfileBuilder />
              </RequireAuth>
            } />
            
            {/* Add redirect for /client */}
            <Route path="/client" element={<Navigate to="/client-login" replace />} />
            
            {/* Redirects */}
            <Route path="/login" element={<Navigate to="/client-login" />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <Toaster />
          <SonnerToaster position="top-right" />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
