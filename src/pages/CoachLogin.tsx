
import React from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';

const CoachLogin = () => {
  return (
    <AuthLayout 
      variant="coach"
      title="Coach Portal"
      subtitle="Sign in to access your coaching dashboard"
    >
      <LoginForm variant="coach" />
    </AuthLayout>
  );
};

export default CoachLogin;
