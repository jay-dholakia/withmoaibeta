
import React, { useEffect, useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { toast } from 'sonner';

const ClientLogin = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only proceed if authentication is complete and we have a client user
    if (!loading && user && userType === 'client') {
      console.log('ClientLogin: Authenticated user detected:', user.id);
      setIsRedirecting(true);
      
      // Navigate to client dashboard immediately
      navigate('/client-dashboard/moai', { replace: true });
    }
  }, [user, userType, loading, navigate]);

  // If we're already logged in, show a minimal loading state
  if (isRedirecting || (!loading && user && userType === 'client')) {
    return (
      <AuthLayout 
        variant="client"
        title="Redirecting..."
        subtitle="Please wait while we take you to your dashboard"
      >
        <div className="flex justify-center py-8 w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-client"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      variant="client"
      title="Member Portal"
      subtitle="Sign in or sign up to access your personal dashboard"
    >
      <div className="w-full max-w-md" style={{ position: 'relative', zIndex: 20 }}>
        <LoginForm variant="client" />
      </div>
    </AuthLayout>
  );
};

export default ClientLogin;
