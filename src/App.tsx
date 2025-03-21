
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
import { AuthProvider } from "./contexts/AuthContext";
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

// Placeholder Dashboard page for client
const ClientDashboard = () => <div>Client Dashboard</div>;

// Protected route component
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

const queryClient = new QueryClient();

const App = () => (
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
              
              {/* Admin Dashboard Routes */}
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
              
              {/* Coach and Client Dashboard Routes */}
              <Route 
                path="/coach-dashboard" 
                element={
                  <ProtectedRoute userType="coach" redirectTo="/coach">
                    <CoachDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/client-dashboard" 
                element={
                  <ProtectedRoute userType="client" redirectTo="/client">
                    <ClientDashboard />
                  </ProtectedRoute>
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

export default App;
