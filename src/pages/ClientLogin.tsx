
import React from 'react';
import { toast } from 'sonner';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';

const ClientLogin = () => {
  const handleSubmit = (email: string, password: string) => {
    // For demo purposes - in a real app, this would call an authentication API
    console.log('Client login attempt:', { email, password });
    toast.success('Client login successful!');
  };

  return (
    <AuthLayout 
      variant="client"
      title="Client Portal"
      subtitle="Sign in to access your personal dashboard"
    >
      <LoginForm variant="client" onSubmit={handleSubmit} />
    </AuthLayout>
  );
};

export default ClientLogin;
