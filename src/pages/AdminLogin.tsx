
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
  const [forceRender, setForceRender] = useState(0);

  console.log('AdminLogin rendering with:', {
    userId: user?.id,
    userType,
    authLoading,
    localLoading,
    hasAttemptedRedirect,
    pathname: window.location.pathname,
    forceRender
  });

  // Add a fail-safe to ensure the component re-renders if auth loading gets stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Force re-render timer triggered');
      setForceRender(prev => prev + 1);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [forceRender]);

  // Reset redirect state when auth loading changes
  useEffect(() => {
    if (authLoading) {
      console.log('Auth loading changed to true - resetting redirect attempt tracking');
      setHasAttemptedRedirect(false);
    }
  }, [authLoading]);

  // Handle redirection logic based on auth state
  useEffect(() => {
    console.log('AdminLogin redirect effect - Auth state:', {
      userId: user?.id,
      userType,
      authLoading,
      localLoading,
      hasAttemptedRedirect
    });
    
    // Only attempt to redirect when auth is not loading and we haven't tried yet
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
      else {
        console.log('No user detected or user type not determined yet');
      }
    }
  }, [user, userType, authLoading, navigate, hasAttemptedRedirect]);

  // Show a clear loading state with debugging info
  if (authLoading || localLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-admin border-opacity-50 border-t-admin rounded-full mx-auto mb-4"></div>
          <p>{authLoading ? "Checking authentication..." : "Processing..."}</p>
          <p className="text-xs text-gray-500 mt-2">
            Auth loading: {authLoading ? "Yes" : "No"} | 
            Local loading: {localLoading ? "Yes" : "No"} |
            Attempted redirect: {hasAttemptedRedirect ? "Yes" : "No"}
          </p>
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
