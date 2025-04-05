
import React, { useEffect, useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchClientProfile, createClientProfile } from '@/services/client-service';
import { PageTransition } from '@/components/PageTransition';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ClientLogin = () => {
  const { user, userType, loading, session } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      // Only proceed if authentication is complete and we have a client user
      if (!loading && user && userType === 'client' && session) {
        console.log('ClientLogin: Authenticated user detected:', user.id);
        
        // Set redirecting state to show loading UI
        setIsRedirecting(true);
        
        try {
          // First, ensure a profile exists by creating one if it doesn't
          await createClientProfile(user.id);
          
          // Then check if user has a complete profile
          const profile = await fetchClientProfile(user.id);
          console.log('ClientLogin: Profile status:', profile);
          
          if (profile && profile.profile_completed) {
            console.log('ClientLogin: Profile complete, redirecting to dashboard');
            navigate('/client-dashboard');
          } else {
            console.log('ClientLogin: Profile incomplete, redirecting to profile builder');
            navigate('/client-profile-builder');
          }
        } catch (error) {
          console.error('ClientLogin: Error checking profile:', error);
          setRedirectAttempts(prev => prev + 1);
          
          // Even with errors, try to navigate to profile builder
          if (redirectAttempts < 2) {
            console.log('ClientLogin: Retrying navigation to profile builder');
            setTimeout(() => navigate('/client-profile-builder'), 500);
          } else {
            // If multiple attempts fail, reset state and let user try again
            setIsRedirecting(false);
            toast.error('Unable to load your profile. Please try signing in again.');
          }
        }
      }
    };
    
    checkUserAndRedirect();
  }, [user, userType, loading, navigate, redirectAttempts, session]);

  // If we're already logged in, show a loading state until the redirect happens
  if (isRedirecting || (!loading && user && userType === 'client' && session)) {
    return (
      <PageTransition>
        <AuthLayout 
          variant="client"
          title="Redirecting..."
          subtitle="Please wait while we take you to your dashboard"
        >
          <div className="flex justify-center py-8 w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
