
import React, { useEffect, useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchClientProfile, createClientProfile } from '@/services/client-service';
import { PageTransition } from '@/components/PageTransition';
import { toast } from 'sonner';

const ClientLogin = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      // Only proceed if authentication is complete and we have a client user
      if (!loading && user && userType === 'client') {
        console.log('ClientLogin: Authenticated user detected:', user.id);
        
        // Set redirecting state to show loading UI
        setIsRedirecting(true);
        
        try {
          // Navigate to client dashboard
          console.log('ClientLogin: Redirecting to client dashboard');
          navigate('/client-dashboard/moai');
        } catch (error) {
          console.error('ClientLogin: Error during redirect:', error);
          toast.error('Error logging in. Please try again.');
          setIsRedirecting(false);
        }
      }
    };
    
    checkUserAndRedirect();
  }, [user, userType, loading, navigate]);

  // If we're already logged in, show a loading state until the redirect happens
  if (isRedirecting || (!loading && user && userType === 'client')) {
    return (
      <PageTransition>
        <AuthLayout 
          variant="client"
          title="Redirecting..."
          subtitle="Please wait while we take you to your dashboard"
        >
          <div className="flex justify-center py-8 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-client"></div>
          </div>
        </AuthLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AuthLayout 
        variant="client"
        title="Member Portal"
        subtitle="Sign in or sign up to access your personal dashboard"
      >
        <div className="w-full max-w-md" style={{ position: 'relative', zIndex: 20 }}>
          <LoginForm variant="client" />
        </div>
      </AuthLayout>
    </PageTransition>
  );
};

export default ClientLogin;
