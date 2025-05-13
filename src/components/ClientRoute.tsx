
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ClientRouteProps {
  children: React.ReactNode;
}

const ClientRoute: React.FC<ClientRouteProps> = ({ children }) => {
  // Wrap the useLocation hook in a try/catch block to prevent errors
  // when the component is rendered outside of a Router context
  let location;
  try {
    location = useLocation();
  } catch (error) {
    console.error("ClientRoute: Router context not available", error);
    // Return loading state instead of crashing when no router context is available
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-client"></span>
        <span className="ml-3">Initializing...</span>
      </div>
    );
  }
  
  const { user, userType, authLoading, profileLoading } = useAuth();
  
  // If auth is loading, show loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-client"></span>
        <span className="ml-3">Authenticating...</span>
      </div>
    );
  }

  // While profile is loading but authentication is confirmed, show a different message
  if (!authLoading && profileLoading && user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-client"></span>
        <span className="ml-3">Loading profile...</span>
      </div>
    );
  }

  // If not authenticated as client, redirect to login
  if (!user || userType !== 'client') {
    console.log("ClientRoute: Access denied, redirecting to login", { userType });
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated as client, render children
  return <>{children}</>;
};

export default ClientRoute;
