
import React from 'react';
import { toast } from 'sonner';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';

const AdminLogin = () => {
  const handleSubmit = (email: string, password: string) => {
    // For demo purposes - in a real app, this would call an authentication API
    console.log('Admin login attempt:', { email, password });
    toast.success('Admin login successful!');
  };

  return (
    <AuthLayout 
      variant="admin"
      title="Admin Portal"
      subtitle="Sign in to access the administrative dashboard"
    >
      <LoginForm variant="admin" onSubmit={handleSubmit} />
    </AuthLayout>
  );
};

export default AdminLogin;
