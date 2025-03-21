
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-dashboard/invitations" element={<InvitationsPage />} />
              <Route path="/admin-dashboard/clients" element={<ClientsPage />} />
              <Route path="/admin-dashboard/coaches" element={<CoachesPage />} />
              <Route path="/admin-dashboard/groups" element={<GroupsPage />} />
              <Route path="/admin-dashboard/groups/:groupId" element={<GroupDetailsPage />} />
              
              {/* Coach and Client Dashboard Routes */}
              <Route path="/coach-dashboard" element={<CoachDashboard />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
