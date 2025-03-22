import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import CoachLogin from "./pages/CoachLogin";
import ClientLogin from "./pages/ClientLogin";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdminDashboard from "./pages/admin/AdminDashboard";
import InvitationsPage from "./pages/admin/InvitationsPage";
import ClientsPage from "./pages/admin/ClientsPage";
import CoachesPage from "./pages/admin/CoachesPage";
import GroupsPage from "./pages/admin/GroupsPage";
import GroupDetailsPage from "./pages/admin/GroupDetailsPage";
import RegisterPage from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import AdminSetup from "./pages/AdminSetup";
import CoachDashboard from "./pages/coach/CoachDashboard";
import WorkoutProgramsPage from "./pages/coach/WorkoutProgramsPage";
import CreateWorkoutProgramPage from "./pages/coach/CreateWorkoutProgramPage";
import WorkoutProgramDetailPage from "./pages/coach/WorkoutProgramDetailPage";
import ProgramAssignmentPage from "./pages/coach/ProgramAssignmentPage";
import CoachClientsPage from "./pages/coach/ClientsPage";
import ProfilePage from "./pages/coach/ProfilePage";
import LeaderboardPage from './pages/coach/LeaderboardPage';
import ProfileBuilder from './pages/client/ProfileBuilder';
import ProfileEditor from './pages/client/ProfileEditor';
import ClientDashboard from './pages/client/ClientDashboard';
import { useQuery } from "@tanstack/react-query";
import { fetchClientProfile } from "./services/client-service";
import { Loader2 } from "lucide-react";

const ClientProtectedRoute = ({ children, redirectTo = "/client" }) => {
  const { user, userType, loading } = useAuth();
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile-check', user?.id],
    queryFn: async () => {
      console.log('Checking profile completion for user:', user?.id);
      if (!user?.id) return null;
      try {
        const result = await fetchClientProfile(user.id);
        console.log('Profile check result:', result);
        return result;
      } catch (error) {
        console.error('Profile check error:', error);
        return null;
      }
    },
    enabled: !!user && userType === 'client',
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
  });
  
  if (loading || profileLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
        <span className="ml-2 text-muted-foreground">Loading your profile...</span>
      </div>
    );
  }
  
  if (!user || userType !== 'client') {
    console.log('User not authenticated or not a client, redirecting to', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }
  
  if (!profile || !profile.profile_completed) {
    console.log('Profile incomplete, redirecting to profile builder');
    return <Navigate to="/client-profile-builder" replace />;
  }
  
  console.log('Profile complete, showing client dashboard');
  return children;
};

const ProtectedRoute = ({ children, userType, redirectTo = "/" }) => {
  const { user, userType: authUserType, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user || (userType && authUserType !== userType)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/coach" element={<CoachLogin />} />
                <Route path="/client" element={<ClientLogin />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin-setup" element={<AdminSetup />} />
                
                <Route 
                  path="/admin-dashboard" 
                  element={
                    <ProtectedRoute userType="admin" redirectTo="/admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin-dashboard/invitations" 
                  element={
                    <ProtectedRoute userType="admin" redirectTo="/admin">
                      <InvitationsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin-dashboard/clients" 
                  element={
                    <ProtectedRoute userType="admin" redirectTo="/admin">
                      <ClientsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin-dashboard/coaches" 
                  element={
                    <ProtectedRoute userType="admin" redirectTo="/admin">
                      <CoachesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin-dashboard/groups" 
                  element={
                    <ProtectedRoute userType="admin" redirectTo="/admin">
                      <GroupsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin-dashboard/groups/:groupId" 
                  element={
                    <ProtectedRoute userType="admin" redirectTo="/admin">
                      <GroupDetailsPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/coach-dashboard" 
                  element={
                    <ProtectedRoute userType="coach" redirectTo="/coach">
                      <CoachDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/coach-dashboard/workouts" 
                  element={
                    <ProtectedRoute userType="coach" redirectTo="/coach">
                      <WorkoutProgramsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/coach-dashboard/workouts/new" 
                  element={
                    <ProtectedRoute userType="coach" redirectTo="/coach">
                      <CreateWorkoutProgramPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/coach-dashboard/workouts/:programId" 
                  element={
                    <ProtectedRoute userType="coach" redirectTo="/coach">
                      <WorkoutProgramDetailPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/coach-dashboard/workouts/:programId/assign" 
                  element={
                    <ProtectedRoute userType="coach" redirectTo="/coach">
                      <ProgramAssignmentPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/coach-dashboard/clients" 
                  element={
                    <ProtectedRoute userType="coach" redirectTo="/coach">
                      <CoachClientsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/coach-dashboard/profile" 
                  element={
                    <ProtectedRoute userType="coach" redirectTo="/coach">
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/coach-dashboard/leaderboards" 
                  element={
                    <ProtectedRoute userType="coach" redirectTo="/coach">
                      <LeaderboardPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/client-profile-builder" 
                  element={
                    <ProtectedRoute userType="client" redirectTo="/client">
                      <ProfileBuilder />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/client-profile-editor" 
                  element={
                    <ProtectedRoute userType="client" redirectTo="/client">
                      <ProfileEditor />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/client-dashboard/*" 
                  element={
                    <ClientProtectedRoute redirectTo="/client">
                      <ClientDashboard />
                    </ClientProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
