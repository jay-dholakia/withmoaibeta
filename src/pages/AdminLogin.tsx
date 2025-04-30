import React, { useEffect, useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Lightbulb } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, userType, authLoading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);
  const [forceSafetyReset, setForceSafetyReset] = useState(false);

  // Debug information
  console.log('AdminLogin rendering with:', {
    userId: user?.id,
    userType,
    authLoading,
    localLoading,
    hasAttemptedRedirect,
    pathname: window.location.pathname
  });

  // Safety net: If loading states get stuck for more than 5 seconds after login attempt, reset them
  useEffect(() => {
    if (localLoading) {
      const timer = setTimeout(() => {
        console.log('Safety reset triggered - forcibly resetting loading states');
        setLocalLoading(false);
        setForceSafetyReset(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [localLoading]);

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
    // If we triggered the safety reset, show a special message
    if (forceSafetyReset) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Authentication Timeout</h2>
            <p className="mb-4 text-gray-700">The authentication process is taking longer than expected.</p>
            <p className="mb-4 text-sm text-gray-600">
              User ID: {user?.id || 'Not set'}<br/>
              User Type: {userType || 'Not determined'}<br/>
              Auth Loading: {authLoading ? 'Yes' : 'No'}<br/>
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-admin border-opacity-50 border-t-admin rounded-full mx-auto mb-4"></div>
          <p className="mb-2">{authLoading ? "Checking authentication..." : "Processing..."}</p>
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
        <div className="mt-6 space-y-4">
          <div className="bg-admin/5 border border-admin/10 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-admin shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-admin mb-1">Need an admin account?</p>
                <p className="text-gray-600">
                  Initial admin setup can be done through the setup page. After that, only existing admins can create new admin accounts.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link to="/admin-setup">
              <Button variant="link" className="text-sm text-blue-500 hover:text-blue-700">
                First time setup? Create admin account
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="w-full max-w-md" style={{ position: 'relative', zIndex: 20 }}>
        <LoginForm
          variant="admin"
          onLoginStart={() => {
            console.log('Login start callback triggered');
            setLocalLoading(true);
            setForceSafetyReset(false); // Reset safety flag on new login attempt
          }}
          onLoginEnd={() => {
            console.log('Login end callback triggered');
            setLocalLoading(false);
          }}
        />
      </div>
    </AuthLayout>
  );
};

export default AdminLogin;
