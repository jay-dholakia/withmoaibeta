
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface RequireAuthProps {
  allowedUserTypes: string[];
  children?: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ allowedUserTypes, children }) => {
  const { user, userType, authLoading } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const location = useLocation();
  
  console.log("RequireAuth rendering with:", { 
    user: user?.id, 
    userType, 
    allowedTypes: allowedUserTypes,
    authLoading,
    isAdmin,
    path: location.pathname
  });

  // If auth or admin status is loading, show loading state
  if (authLoading || isAdminLoading) {
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

  // If user is admin, they have access to all routes
  if (isAdmin) {
    console.log("RequireAuth: User is admin, granting access to all routes");
    return <>{children ? children : <Outlet />}</>;
  }

  // For AI Insights page, allow coaches with admin privileges
  if (location.pathname.includes('/coach-dashboard/ai-insights') && isAdmin) {
    console.log("RequireAuth: Admin accessing AI Insights page");
    return <>{children ? children : <Outlet />}</>;
  }

  // Special case: Admin routes for coaches with admin permission
  if (
    allowedUserTypes.includes('admin') && 
    userType === 'coach' && 
    isAdmin &&
    location.pathname.includes('admin')
  ) {
    console.log("RequireAuth: Coach with admin privileges accessing admin route");
    return <>{children ? children : <Outlet />}</>;
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
