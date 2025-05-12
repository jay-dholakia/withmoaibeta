
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, userType, authLoading, profileLoading } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const location = useLocation();
  
  console.log("AdminRoute check:", { 
    userId: user?.id,
    userType,
    isAdmin,
    authLoading,
    profileLoading,
    isAdminLoading
  });
  
  // If any loading state is true, show loading spinner
  if (authLoading || profileLoading || isAdminLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin"></span>
        <span className="ml-3">Authenticating...</span>
      </div>
    );
  }

  // If no user is authenticated, redirect to login
  if (!user) {
    console.log("AdminRoute: No user found, redirecting to admin-login");
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // If user type is admin, grant access even if isAdmin check hasn't completed or failed
  if (userType === 'admin') {
    console.log("AdminRoute: Access granted for admin user by userType");
    return <>{children}</>;
  }

  // If explicit admin check failed, redirect
  if (!isAdmin) {
    console.log("AdminRoute: User is not admin, redirecting to admin-login", { userType, isAdmin });
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  console.log("AdminRoute: Access granted for admin user");
  return <>{children}</>;
};

export default AdminRoute;
