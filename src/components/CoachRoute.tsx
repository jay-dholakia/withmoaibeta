
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface CoachRouteProps {
  children: React.ReactNode;
}

const CoachRoute: React.FC<CoachRouteProps> = ({ children }) => {
  const { user, userType, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-coach"></span>
        <span className="ml-3">Authenticating...</span>
      </div>
    );
  }

  if (!user || userType !== 'coach') {
    console.log("CoachRoute: Access denied, redirecting to login", { userType, path: location.pathname });
    // Remember the current location so we can redirect back after login
    return <Navigate to="/coach-login" state={{ from: location }} replace />;
  }

  console.log("CoachRoute: Access granted for coach user", { path: location.pathname });
  return <>{children}</>;
};

export default CoachRoute;
