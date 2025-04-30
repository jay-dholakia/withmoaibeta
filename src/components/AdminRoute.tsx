
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, userType, authLoading, profileLoading } = useAuth();
  const location = useLocation();
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin"></span>
        <span className="ml-3">Authenticating...</span>
      </div>
    );
  }

  // While profile is loading but authentication is confirmed, show a different message
  if (!authLoading && profileLoading && user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin"></span>
        <span className="ml-3">Loading profile...</span>
      </div>
    );
  }

  if (!user || userType !== 'admin') {
    console.log("AdminRoute: Access denied, redirecting to login", { userType });
    // Remember the current location so we can redirect back after login
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
