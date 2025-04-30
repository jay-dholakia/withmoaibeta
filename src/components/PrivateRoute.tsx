
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  if (!user) {
    // Redirect them to the login page
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
