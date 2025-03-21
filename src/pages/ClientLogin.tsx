
import React, { useEffect } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchClientProfile } from '@/services/client-service';

const ClientLogin = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      // Only proceed if authentication is complete and we have a client user
      if (!loading && user && userType === 'client') {
        console.log('ClientLogin: Authenticated user detected:', user.id);
        
        try {
          // Check if user has a complete profile
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
          // If we can't check the profile, default to profile builder
          navigate('/client-profile-builder');
        }
      }
    };
    
    checkUserAndRedirect();
  }, [user, userType, loading, navigate]);

  // If we're already logged in, show a loading state until the redirect happens
  if (!loading && user && userType === 'client') {
    return (
      <AuthLayout 
        variant="client"
        title="Redirecting..."
        subtitle="Please wait while we take you to your dashboard"
      >
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-client"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      variant="client"
      title="Client Portal"
      subtitle="Sign in or sign up to access your personal dashboard"
    >
      <LoginForm variant="client" />
    </AuthLayout>
  );
};

export default ClientLogin;
