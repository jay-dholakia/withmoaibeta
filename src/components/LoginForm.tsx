
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  variant: 'admin' | 'coach' | 'client';
  onSubmit?: (email: string, password: string) => void;
  onLoginStart?: () => void;
  onLoginEnd?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  variant,
  onSubmit,
  onLoginStart,
  onLoginEnd
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const { signIn, signUp, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('Auth loading state changed:', authLoading);
    if (!authLoading) {
      setLocalLoading(false);
      setIsSubmitting(false);
      if (onLoginEnd) onLoginEnd();
    }
  }, [authLoading, onLoginEnd]);

  useEffect(() => {
    if (isRegistering && (variant === 'admin' || variant === 'coach')) {
      setIsRegistering(false);
    }
  }, [isRegistering, variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (localLoading || isSubmitting || authLoading) {
      console.log('Preventing resubmission: local loading or already submitting');
      return;
    }
    
    console.log(`Submitting ${isRegistering ? 'registration' : 'login'} form for ${variant}`);
    setLocalLoading(true);
    setIsSubmitting(true);
    
    if (onLoginStart) onLoginStart();
    
    try {
      if (isRegistering) {
        if (variant === 'admin' || variant === 'coach') {
          toast.error(`${variant.charAt(0).toUpperCase() + variant.slice(1)} accounts cannot be self-registered`);
          setLocalLoading(false);
          setIsSubmitting(false);
          if (onLoginEnd) onLoginEnd();
          return;
        }
        await signUp(email, password, variant);
      } else {
        if (onSubmit) {
          onSubmit(email, password);
        } else {
          console.log(`Signing in as ${variant} with email: ${email}`);
          await signIn(email, password, variant);
        }
      }
    } catch (error) {
      console.error(isRegistering ? 'Registration error:' : 'Login error:', error);
      setLocalLoading(false);
      setIsSubmitting(false);
      if (onLoginEnd) onLoginEnd();
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
  const isDisabled = localLoading || isSubmitting || authLoading;

  if (forgotPassword) {
    return <ForgotPasswordForm onBack={() => setForgotPassword(false)} variant={variant} />;
  }

  // Helper function to focus the input when its container is clicked
  const handleContainerClick = (inputId: string) => {
    document.getElementById(inputId)?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="w-full max-w-md mx-auto form-shine glass-card rounded-xl p-8"
    >
      {(variant === 'admin' || variant === 'coach') && isRegistering && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-start">
          <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
          <p className="text-sm">
            {variant.charAt(0).toUpperCase() + variant.slice(1)} accounts cannot be self-registered. Please contact an administrator.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div 
          className="space-y-2 relative"
          onClick={() => handleContainerClick('email')}
        >
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${styles.inputFocusRing} bg-background/50 transition-all duration-200 cursor-text`}
            placeholder="Enter your email"
            required
            disabled={isDisabled}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setForgotPassword(true);
              }}
              className={`text-sm ${styles.textColor} hover:underline`}
              disabled={isDisabled}
            >
              Forgot password?
            </button>
          </div>
          <div 
            className="relative" 
            onClick={() => handleContainerClick('password')}
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${styles.inputFocusRing} bg-background/50 transition-all duration-200 cursor-text`}
              placeholder="Enter your password"
              required
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPassword(!showPassword);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isDisabled}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isDisabled}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${styles.buttonClass} btn-hover-effect ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {(localLoading || isSubmitting || authLoading) ? (
            <span className="flex items-center justify-center">
              <Loader2 size={18} className="animate-spin mr-2" />
              {isRegistering ? 'Signing up...' : 'Signing in...'}
            </span>
          ) : (
            isRegistering ? 'Sign up' : 'Sign in'
          )}
        </button>

        {variant === 'client' && (
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className={`${styles.textColor} hover:underline`}
              disabled={isDisabled}
            >
              {isRegistering 
                ? 'Already have an account? Sign in' 
                : `Don't have an account? Sign up`}
            </button>
          </div>
        )}
      </form>
    </motion.div>
  );
};
