
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  userType: 'admin' | 'coach' | 'client';
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, userType }) => {
  const { user, userType: currentUserType, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to the appropriate login page based on userType
    const loginRoutes = {
      admin: '/admin-login',
      coach: '/coach-login',
      client: '/client-login'
    };

    return <Navigate to={loginRoutes[userType]} state={{ from: location }} replace />;
  }

  // Check if user has the required type
  if (currentUserType !== userType) {
    // Redirect to the appropriate dashboard based on actual user type
    const dashboardRoutes = {
      admin: '/admin-dashboard',
      coach: '/coach-dashboard',
      client: '/client-dashboard'
    };

    // Only redirect if the user has a valid type with a dashboard
    if (currentUserType && dashboardRoutes[currentUserType]) {
      return <Navigate to={dashboardRoutes[currentUserType]} replace />;
    }

    // If user has an invalid type, redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
