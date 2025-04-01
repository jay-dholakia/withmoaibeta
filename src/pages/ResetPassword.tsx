import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { sendPasswordResetEmail } from '@/services/client-service';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailToResend, setEmailToResend] = useState('');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const userType = searchParams.get('type') || 'client';
  const [errorState, setErrorState] = useState({
    hasError: false,
    message: '',
    code: ''
  });
  
  useEffect(() => {
    // Check for hash parameters that might contain error info
    const checkForErrors = () => {
      try {
        // For hash fragments like #error=access_denied&error_code=otp_expired
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          console.log('Auth error detected:', { error, errorCode, errorDescription });
          setErrorState({
            hasError: true,
            message: errorDescription || 'Your reset link appears to be invalid or expired.',
            code: errorCode || error
          });
          
          // Try to extract the email from the URL if present
          const email = hashParams.get('email') || '';
          if (email) {
            setEmailToResend(email);
          }
          
          return true;
        }
      } catch (e) {
        console.error('Error parsing URL hash:', e);
      }
      
      return false;
    };
    
    // First check if there's an error in the URL
    const hasError = checkForErrors();
    
    // If no error and we have a hash that looks like an access token, attempt to parse session
    if (!hasError && window.location.hash && window.location.hash.includes('access_token')) {
      // The hash contains authentication data, let Supabase handle it
      console.log('Auth hash detected, proceeding with reset flow');
    } else if (!hasError && !window.location.hash) {
      // No hash at all, might be a direct navigation to this page
      toast.error('No reset information found. Please use a valid reset link.');
      setTimeout(() => navigate(`/${userType}-login`), 3000);
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
        console.error('Password update error:', error);
        toast.error(error.message);
        
        // If the error indicates an expired session, show the resend option
        if (error.message.toLowerCase().includes('expired') || 
            error.message.toLowerCase().includes('invalid')) {
          setErrorState({
            hasError: true,
            message: 'Your reset link has expired. Please request a new one.',
            code: 'session_expired'
          });
        }
        return;
      }
      
      setSuccess(true);
      toast.success('Password updated successfully');
      
      setTimeout(() => {
        navigate(`/${userType}-login`);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    try {
      setResendLoading(true);
      
      // If we don't have a stored email, we'll need to ask for one
      if (!emailToResend) {
        toast.error('Please contact support for assistance with resetting your password');
        return;
      }
      
      await sendPasswordResetEmail(emailToResend);
      toast.success('A new password reset link has been sent to your email');
      setTimeout(() => {
        navigate(`/${userType}-login`);
      }, 3000);
    } catch (error) {
      console.error('Error resending password reset:', error);
      toast.error('Failed to send new password reset link');
    } finally {
      setResendLoading(false);
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

  // If we have an error state (invalid or expired link)
  if (errorState.hasError) {
    return (
      <AuthLayout 
        title="Reset Password"
        variant={userType as 'admin' | 'coach' | 'client' | 'default'}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md mx-auto form-shine glass-card rounded-xl p-8"
        >
          <div className="text-center space-y-4">
            <AlertTriangle size={48} className="mx-auto text-amber-500" />
            <h2 className="text-2xl font-bold">Link Issue</h2>
            <p className="text-muted-foreground">
              {errorState.message}
            </p>
            
            <div className="pt-4">
              <Button
                onClick={handleResendLink}
                disabled={resendLoading || !emailToResend}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${styles.buttonClass} btn-hover-effect`}
              >
                {resendLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Sending new link...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <RefreshCw size={18} className="mr-2" />
                    Send a new reset link
                  </span>
                )}
              </Button>
              
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${userType}-login`)}
                  className="w-full"
                >
                  Return to login
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Reset Password"
      variant={userType as 'admin' | 'coach' | 'client' | 'default'}
    >
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
