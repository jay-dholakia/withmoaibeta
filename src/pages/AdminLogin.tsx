
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
    // Check if user is logged in as admin
    if (user && userType === 'admin' && !authLoading) {
      console.log('Admin already logged in, redirecting to dashboard');
      
      // Only set redirecting if we haven't already to prevent loops
      if (!isRedirecting) {
        setIsRedirecting(true);
        
        // Navigate immediately - no need for timeout which can cause issues
        navigate('/admin-dashboard');
      }
    } else if (user && userType !== 'admin' && !authLoading) {
      // Handle case where user is logged in but not as admin
      toast.error('You are logged in but not as an admin. Please log in with an admin account.');
      setIsRedirecting(false);
    } else if (!user && !authLoading && isRedirecting) {
      // Reset redirecting state if user is not logged in
      setIsRedirecting(false);
    }
  }, [user, userType, authLoading, navigate, isRedirecting]);

  // If loading or redirecting, show spinner
  if (isRedirecting || (authLoading && user)) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-admin border-opacity-50 border-t-admin rounded-full mx-auto mb-4"></div>
        <p>Redirecting to dashboard...</p>
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
