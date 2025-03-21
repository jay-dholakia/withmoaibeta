
import React from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';

const ClientLogin = () => {
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
