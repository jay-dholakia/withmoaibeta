
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, userType } = useAuth();
  const location = useLocation();

  // If user is already authenticated, redirect to their appropriate dashboard
  if (user) {
    // Redirect based on user type
    if (userType === 'admin') {
      return <Navigate to="/admin-dashboard" replace state={{ from: location }} />;
    } else if (userType === 'coach') {
      return <Navigate to="/coach-dashboard" replace state={{ from: location }} />;
    } else if (userType === 'client') {
      return <Navigate to="/client-dashboard" replace state={{ from: location }} />;
    }
  }

  // Not authenticated, show the public content
  return <>{children}</>;
};

export default PublicRoute;
