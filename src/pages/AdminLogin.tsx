
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
    
    // Only redirect when we have a valid admin user and auth is not loading
    if (user && userType === 'admin' && !authLoading) {
      console.log('Admin user detected, navigating to dashboard immediately');
      navigate('/admin-dashboard');
    } 
    // Handle case where user is logged in but not as admin
    else if (user && userType !== 'admin' && !authLoading) {
      console.log('User logged in as non-admin:', userType);
      toast.error('You are logged in but not as an admin. Please log in with an admin account.');
    }
  }, [user, userType, authLoading, navigate]);

  // Show simple loading indicator when auth is being checked
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
