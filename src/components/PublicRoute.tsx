
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, userType, loading } = useAuth();
  const location = useLocation();

  // Wait for authentication to complete before redirecting
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  // If user is already authenticated, redirect to their appropriate dashboard
  if (user && userType) {
    console.log("PublicRoute: Redirecting authenticated user to dashboard", { userType });
    
    // Redirect based on user type
    if (userType === 'admin') {
      return <Navigate to="/admin-dashboard" replace state={{ from: location }} />;
    } else if (userType === 'coach') {
      return <Navigate to="/coach-dashboard" replace state={{ from: location }} />;
    } else if (userType === 'client') {
      return <Navigate to="/client-dashboard" replace state={{ from: location }} />;
    }
  }

  // Not authenticated or loading, show the public content
  console.log("PublicRoute: Showing public content", { user, userType, loading });
  return <>{children}</>;
};

export default PublicRoute;
