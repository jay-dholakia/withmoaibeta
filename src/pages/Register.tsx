
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/layouts/AuthLayout';

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout 
      title="Registration"
      subtitle="Registration functionality has been removed"
      variant="default"
    >
      <div className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          The invitation and registration system has been removed.
        </p>
        <Button className="w-full" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
