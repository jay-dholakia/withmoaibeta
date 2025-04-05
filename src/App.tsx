import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ClientDashboard from './pages/client/ClientDashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientLayout from './components/ClientLayout';
import TrainerLayout from './components/TrainerLayout';
import AdminLayout from './components/AdminLayout';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import ClientSignupPage from './pages/ClientSignupPage';
import TrainerSignupPage from './pages/TrainerSignupPage';
import { Toaster } from 'sonner';
import WorkoutsPage from './pages/client/WorkoutsPage';
import LogCardioPage from './pages/client/LogCardioPage';
import LogRunPage from './pages/client/LogRunPage';

// Protected route component
function RequireAuth({ children, userType, redirectTo }: {
  children: React.ReactNode;
  userType: 'client' | 'trainer' | 'admin';
  redirectTo: string;
}) {
  const { user, userRole } = useAuth();

  if (!user) {
    return <Navigate to={redirectTo} />;
  }

  if (userRole !== userType) {
    // Redirect to unauthorized page or appropriate dashboard
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

function App() {
  const { authLoading } = useAuth();

  if (authLoading) {
    return <div>Loading...</div>; // Replace with a proper loading indicator
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/client-login" />} />
        <Route path="/client-login" element={<LoginPage userType="client" />} />
        <Route path="/trainer-login" element={<LoginPage userType="trainer" />} />
        <Route path="/admin-login" element={<LoginPage userType="admin" />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/update-password/:token" element={<UpdatePasswordPage />} />
        <Route path="/client-signup" element={<ClientSignupPage />} />
        <Route path="/trainer-signup" element={<TrainerSignupPage />} />

        <Route path="/client-dashboard" element={<RequireAuth userType="client" redirectTo="/client-login" />}>
          <Route element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
            <Route path="workouts/*" element={<WorkoutsPage />} />
            <Route path="log-run" element={<LogRunPage />} />
            <Route path="log-cardio" element={<LogCardioPage />} />
          </Route>
        </Route>

        <Route path="/trainer-dashboard" element={<RequireAuth userType="trainer" redirectTo="/trainer-login" />}>
          <Route element={<TrainerLayout />}>
            <Route index element={<TrainerDashboard />} />
          </Route>
        </Route>

        <Route path="/admin-dashboard" element={<RequireAuth userType="admin" redirectTo="/admin-login" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
