
import React from 'react';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { AuthLayout } from '@/layouts/AuthLayout';

const PasswordResetRequestPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Reset Your Password" 
      subtitle="Enter your email to receive a password reset link"
      variant="client"
    >
      <ForgotPasswordForm 
        onBack={() => window.history.back()}
        variant="client" 
      />
    </AuthLayout>
  );
};

export default PasswordResetRequestPage;
