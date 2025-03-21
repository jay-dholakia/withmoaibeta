
import React, { useEffect, useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AdminLogin = () => {
  const { user, userType, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log('AdminLogin useEffect - Auth state:', {
      userId: user?.id,
      userType,
      authLoading,
      isRedirecting
    });
    
    // Only attempt redirect if we're not already in the process of redirecting
    // and when auth loading is complete
    if (user && userType === 'admin' && !authLoading && !isRedirecting) {
      console.log('Admin login detected, preparing to redirect');
      setIsRedirecting(true);
      
      // Add a small delay before navigation to avoid potential race conditions
      setTimeout(() => {
        console.log('Executing navigation to admin dashboard');
        navigate('/admin-dashboard');
        
        // Reset redirecting state after a delay in case navigation fails
        setTimeout(() => {
          if (window.location.pathname.includes('admin-dashboard')) {
            console.log('Successfully navigated to admin dashboard');
          } else {
            console.log('Navigation may have failed, resetting redirect state');
            setIsRedirecting(false);
          }
        }, 500);
      }, 100);
    } 
    // Handle case where user is logged in but not as admin
    else if (user && userType !== 'admin' && !authLoading) {
      console.log('User logged in as non-admin:', userType);
      toast.error('You are logged in but not as an admin. Please log in with an admin account.');
      setIsRedirecting(false);
    }
    // Handle case where auth loading completes and no user is found
    else if (!user && !authLoading && isRedirecting) {
      console.log('No user found after auth loading completed, resetting redirect state');
      setIsRedirecting(false);
    }
  }, [user, userType, authLoading, navigate, isRedirecting]);

  // If loading or redirecting, show spinner
  if (isRedirecting) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-admin border-opacity-50 border-t-admin rounded-full mx-auto mb-4"></div>
        <p>Redirecting to dashboard...</p>
      </div>
    </div>;
  }

  // If we're still loading auth but not redirecting, show a simpler loading indicator
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-admin border-opacity-50 border-t-admin rounded-full mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>;
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
      <LoginForm variant="admin" />
    </AuthLayout>
  );
};

export default AdminLogin;
