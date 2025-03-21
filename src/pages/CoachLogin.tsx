
import React from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { Lightbulb } from 'lucide-react';

const CoachLogin = () => {
  return (
    <AuthLayout 
      variant="coach"
      title="Coach Portal"
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
      <LoginForm variant="coach" />
    </AuthLayout>
  );
};

export default CoachLogin;
