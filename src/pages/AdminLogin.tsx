
import React from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';

const AdminLogin = () => {
  return (
    <AuthLayout 
      variant="admin"
      title="Admin Portal"
      subtitle="Sign in to access your coaching dashboard"
    >
      <LoginForm variant="admin" />
    </AuthLayout>
  );
};

export default AdminLogin;
