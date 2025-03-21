
import React from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AdminLogin = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (user && userType === 'admin' && !loading) {
      console.log('Admin already logged in, redirecting to dashboard');
      navigate('/admin-dashboard');
    }
  }, [user, userType, loading, navigate]);

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Sign in to access the admin dashboard"
      variant="admin"
      extraContent={
        <div className="mt-4 text-center">
          <Link to="/admin-setup">
            <Button variant="link" className="text-sm text-blue-500 hover:text-blue-700">
              First time setup? Create admin account
            </Button>
          </Link>
        </div>
      }
    >
      <LoginForm variant="admin" />
    </AuthLayout>
  );
};

export default AdminLogin;
