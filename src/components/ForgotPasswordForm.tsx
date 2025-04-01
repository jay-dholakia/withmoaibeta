import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ForgotPasswordFormProps {
  onBack: () => void;
  variant: 'admin' | 'coach' | 'client';
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBack,
  variant
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=${variant}`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      console.error('Error in password reset:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto form-shine glass-card rounded-xl p-8"
    >
      <button 
        onClick={onBack}
        className="mb-4 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to login
      </button>
      
      {submitted ? (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground">
            We've sent password reset instructions to <span className="font-medium">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            If you don't see the email, check your spam folder or
            <button 
              onClick={handleSubmit}
              className={`ml-1 ${styles.textColor} hover:underline font-medium`}
            >
              click here to resend
            </button>
          </p>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Forgot your password?</h2>
            <p className="text-muted-foreground mt-1">
              Enter your email and we'll send you instructions to reset your password
            </p>
          </div>
          
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
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${styles.buttonClass} btn-hover-effect`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Sending instructions...
                </span>
              ) : (
                'Send reset instructions'
              )}
            </button>
          </form>
        </>
      )}
    </motion.div>
  );
};
