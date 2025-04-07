
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequireAuthProps {
  allowedUserTypes: string[];
  children?: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ allowedUserTypes, children }) => {
  const { user, userType, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has the required type
  if (!userType || !allowedUserTypes.includes(userType)) {
    // Redirect based on user type
    if (userType === 'coach') {
      return <Navigate to="/coach-dashboard" replace />;
    } else if (userType === 'client') {
      return <Navigate to="/client-dashboard" replace />;
    } else {
      // Fallback to login
      return <Navigate to="/" replace />;
    }
  }

  // Return children if they exist, otherwise use Outlet
  return <>{children ? children : <Outlet />}</>;
};

export default RequireAuth;
