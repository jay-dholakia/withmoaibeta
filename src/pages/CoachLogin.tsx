
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { Lightbulb } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CoachLogin = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user && userType === 'coach' && !loading) {
      console.log('Coach authenticated, redirecting to dashboard');
      navigate('/coach-dashboard');
    }
  }, [user, userType, loading, navigate]);

  return (
    <AuthLayout 
      variant="coach"
      title="Moai Coach Portal"
      subtitle="Sign in to access your coaching dashboard"
      extraContent={
        <div className="mt-6 bg-coach/5 border border-coach/10 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-coach shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-coach mb-1">Need a coach account?</p>
              <p className="text-gray-600">
                Coach accounts are created by administrators. Please contact an administrator to get an invitation.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="w-full max-w-md" style={{ position: 'relative', zIndex: 20 }}>
        <LoginForm variant="coach" />
      </div>
    </AuthLayout>
  );
};

export default CoachLogin;
