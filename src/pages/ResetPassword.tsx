import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthLayout } from '@/layouts/AuthLayout';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userType = searchParams.get('type') || 'client';
  
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      toast.error('Invalid or expired password reset link');
      setTimeout(() => {
        navigate(`/${userType}`);
      }, 2000);
    }
  }, [navigate, userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setSuccess(true);
      toast.success('Password updated successfully');
      
      setTimeout(() => {
        navigate(`/${userType}`);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (userType) {
      case 'admin':
        return {
          buttonClass: 'bg-admin hover:bg-admin/90 text-white',
          inputFocusRing: 'focus-visible:ring-admin/20',
          textColor: 'text-admin'
        };
      case 'coach':
        return {
          buttonClass: 'bg-coach hover:bg-coach/90 text-white',
          inputFocusRing: 'focus-visible:ring-coach/20',
          textColor: 'text-coach'
        };
      case 'client':
        return {
          buttonClass: 'bg-client hover:bg-client/90 text-white',
          inputFocusRing: 'focus-visible:ring-client/20',
          textColor: 'text-client'
        };
      default:
        return {
          buttonClass: 'bg-primary hover:bg-primary/90 text-primary-foreground',
          inputFocusRing: 'focus-visible:ring-primary/20',
          textColor: 'text-primary'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto form-shine glass-card rounded-xl p-8"
      >
        {success ? (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">Password Updated</h2>
            <p className="text-muted-foreground">
              Your password has been updated successfully. Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Reset Your Password</h2>
              <p className="text-muted-foreground mt-1">
                Enter your new password below
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg bg-background/50 border border-input ${styles.inputFocusRing} focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-200`}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg bg-background/50 border border-input ${styles.inputFocusRing} focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-200`}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${styles.buttonClass} btn-hover-effect`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Updating password...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
};

export default ResetPassword;
