
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
  
  console.log("RequireAuth rendering with:", { 
    user: user?.id, 
    userType, 
    allowedTypes: allowedUserTypes,
    loading,
    path: location.pathname
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
        <span className="ml-3">Authenticating...</span>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page
    console.log("RequireAuth: No user, redirecting to login");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has the required type
  if (!userType || !allowedUserTypes.includes(userType)) {
    console.log("RequireAuth: User type mismatch", { userType, allowedUserTypes });
    
    // Redirect based on user type
    if (userType === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (userType === 'coach') {
      return <Navigate to="/coach-dashboard" replace />;
    } else if (userType === 'client') {
      return <Navigate to="/client-dashboard" replace />;
    } else {
      // Fallback to login
      return <Navigate to="/" replace />;
    }
  }

  console.log("RequireAuth: Access granted, rendering children or outlet");
  // Return children if they exist, otherwise use Outlet
  return <>{children ? children : <Outlet />}</>;
};

export default RequireAuth;
