
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ForgotPasswordForm } from './ForgotPasswordForm';

interface LoginFormProps {
  variant: 'admin' | 'coach' | 'client';
  onSubmit?: (email: string, password: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  variant,
  onSubmit
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const { signIn, signUp, loading } = useAuth();

  // Prevent self-registration for admin accounts
  useEffect(() => {
    if (isRegistering && variant === 'admin') {
      toast.error('Admin accounts cannot be self-registered. Please contact the system administrator.');
      setIsRegistering(false);
    }
  }, [isRegistering, variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (variant === 'admin') {
        toast.error('Admin accounts cannot be self-registered');
        return;
      }
      try {
        await signUp(email, password, variant);
      } catch (error) {
        console.error('Registration error:', error);
        // Error handling is already in the signUp function
      }
    } else {
      try {
        if (onSubmit) {
          // For backward compatibility
          onSubmit(email, password);
        } else {
          await signIn(email, password, variant);
        }
      } catch (error) {
        console.error('Login error:', error);
        // Error handling is already in the signIn function
      }
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
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

  if (forgotPassword) {
    return <ForgotPasswordForm onBack={() => setForgotPassword(false)} variant={variant} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="w-full max-w-md mx-auto form-shine glass-card rounded-xl p-8"
    >
      {variant === 'admin' && isRegistering && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-start">
          <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
          <p className="text-sm">
            Admin accounts cannot be self-registered. Please contact the system administrator.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-background/50 border border-input ${styles.inputFocusRing} focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-200`}
            placeholder="Enter your email"
            required
            disabled={variant === 'admin' && isRegistering}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <button 
              type="button"
              onClick={() => setForgotPassword(true)}
              className={`text-sm ${styles.textColor} hover:underline`}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg bg-background/50 border border-input ${styles.inputFocusRing} focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-200`}
              placeholder="Enter your password"
              required
              disabled={variant === 'admin' && isRegistering}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={variant === 'admin' && isRegistering}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || (variant === 'admin' && isRegistering)}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${styles.buttonClass} btn-hover-effect ${(variant === 'admin' && isRegistering) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 size={18} className="animate-spin mr-2" />
              {isRegistering ? 'Signing up...' : 'Signing in...'}
            </span>
          ) : (
            isRegistering ? 'Sign up' : 'Sign in'
          )}
        </button>

        <div className="text-center text-sm">
          {variant !== 'admin' ? (
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className={`${styles.textColor} hover:underline`}
            >
              {isRegistering 
                ? 'Already have an account? Sign in' 
                : `Don't have an account? Sign up`}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!isRegistering) {
                  setIsRegistering(true);
                  toast.info('Admin accounts must be created by an existing admin');
                } else {
                  setIsRegistering(false);
                }
              }}
              className={`${styles.textColor} hover:underline`}
            >
              {isRegistering 
                ? 'Back to sign in' 
                : `Don't have an account? Sign up`}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};
