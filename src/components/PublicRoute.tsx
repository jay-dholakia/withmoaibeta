
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, userType, loading } = useAuth();
  const location = useLocation();
  
  // Get the intended destination from location state or use default
  const from = location.state?.from || '/';
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (user) {
    console.log("PublicRoute: Redirecting authenticated user to dashboard", { userType });
    
    if (userType === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (userType === 'coach') {
      return <Navigate to="/coach-dashboard" replace />;
    } else if (userType === 'client') {
      return <Navigate to="/client-dashboard/moai" replace />;
    }
    
    // If we don't recognize the user type, still redirect to a safe default
    return <Navigate to="/client-dashboard/moai" replace />;
  }

  // If not authenticated, show the requested public route
  // Make sure we actually render the children and not directly use them as an element
  return <>{children}</>;
};

export default PublicRoute;
