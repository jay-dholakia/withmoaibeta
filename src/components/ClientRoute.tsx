
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ClientRouteProps {
  children: React.ReactNode;
}

const ClientRoute: React.FC<ClientRouteProps> = ({ children }) => {
  const { user, userType, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-client"></span>
        <span className="ml-3">Authenticating...</span>
      </div>
    );
  }

  if (!user || userType !== 'client') {
    console.log("ClientRoute: Access denied, redirecting to login", { userType });
    // Remember the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ClientRoute;
