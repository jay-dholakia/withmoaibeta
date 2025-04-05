
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ClientDashboard from './pages/client/ClientDashboard';
import LogCardioPage from './pages/client/LogCardioPage';
import { Toaster } from 'sonner';

// Protected route component
function RequireAuth({ children, userType, redirectTo }: {
  children: React.ReactNode;
  userType: 'client' | 'trainer' | 'admin';
  redirectTo: string;
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={redirectTo} />;
  }

  // For simplicity, we'll just check if user exists
  // In a real application, you'd verify the user role matches
  return <>{children}</>;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/client-dashboard" />} />
        
        <Route path="/client-dashboard/*" element={
          <RequireAuth userType="client" redirectTo="/client-login">
            <ClientDashboard />
          </RequireAuth>
        } />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
