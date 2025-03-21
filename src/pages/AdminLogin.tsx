
import React, { useEffect, useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, userType, loading: authLoading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);

  console.log('AdminLogin rendering with:', {
    userId: user?.id,
    userType,
    authLoading,
    localLoading,
    hasAttemptedRedirect,
    pathname: window.location.pathname
  });

  useEffect(() => {
    // Reset the redirect attempt tracking when auth state changes
    if (authLoading) {
      setHasAttemptedRedirect(false);
    }
  }, [authLoading]);

  useEffect(() => {
    console.log('AdminLogin redirect effect - Auth state:', {
      userId: user?.id,
      userType,
      authLoading,
      localLoading,
      hasAttemptedRedirect
    });
    
    // Only attempt to redirect when we have auth state and haven't tried yet
    if (!authLoading && !hasAttemptedRedirect) {
      setHasAttemptedRedirect(true);
      
      // User is logged in as admin, redirect to dashboard
      if (user && userType === 'admin') {
        console.log('Admin user detected, navigating to dashboard');
        navigate('/admin-dashboard');
      } 
      // User is logged in but not as admin
      else if (user && userType !== 'admin') {
        console.log('User logged in as non-admin:', userType);
        toast.error('You are logged in but not as an admin. Please log in with an admin account.');
      }
      // User is not logged in at all - just stay on the login page
    }
  }, [user, userType, authLoading, navigate, hasAttemptedRedirect]);

  // Show loading indicator when either auth is loading or we're in local transition
  const isLoading = authLoading || localLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-admin border-opacity-50 border-t-admin rounded-full mx-auto mb-4"></div>
          <p>{authLoading ? "Checking authentication..." : "Processing..."}</p>
          <p className="text-xs text-gray-500 mt-2">Auth loading: {authLoading ? "Yes" : "No"}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Sign in to access the admin dashboard"
      variant="admin"
      extraContent={
        <div className="mt-4 text-center">
          <Link to="/admin-setup">
            <Button variant="link" className="text-sm text-blue-500 hover:text-blue-700">
              First time setup? Create admin account
            </Button>
          </Link>
        </div>
      }
    >
      <LoginForm
        variant="admin"
        onLoginStart={() => setLocalLoading(true)}
        onLoginEnd={() => setLocalLoading(false)}
      />
    </AuthLayout>
  );
};

export default AdminLogin;
