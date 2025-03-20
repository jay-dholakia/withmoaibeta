
import React from 'react';
import { toast } from 'sonner';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';

const CoachLogin = () => {
  const handleSubmit = (email: string, password: string) => {
    // For demo purposes - in a real app, this would call an authentication API
    console.log('Coach login attempt:', { email, password });
    toast.success('Coach login successful!');
  };

  return (
    <AuthLayout 
      variant="coach"
      title="Coach Portal"
      subtitle="Sign in to access your coaching dashboard"
    >
      <LoginForm variant="coach" onSubmit={handleSubmit} />
    </AuthLayout>
  );
};

export default CoachLogin;
