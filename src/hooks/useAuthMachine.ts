
import { useActor, useMachine } from '@xstate/react';
import { useNavigate } from 'react-router-dom';
import { authMachine } from '../machines/authMachine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAuthMachine = () => {
  const navigate = useNavigate();

  const [state, send] = useMachine(authMachine, {
    services: {
      getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data;
      },
      signIn: async (context, event) => {
        if (event.type !== 'SIGN_IN') throw new Error('Invalid event');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: event.email,
          password: event.password
        });
        
        if (error) throw error;
        
        // Check if user type matches the requested type
        const metadataUserType = data.user?.user_metadata?.user_type;
        if (metadataUserType && metadataUserType !== event.userType) {
          throw new Error(`This account is registered as a ${metadataUserType}, not as a ${event.userType}`);
        }
        
        toast.success('Sign in successful!');
        return data;
      },
      signUp: async (context, event) => {
        if (event.type !== 'SIGN_UP') throw new Error('Invalid event');
        
        const { data, error } = await supabase.auth.signUp({
          email: event.email,
          password: event.password,
          options: {
            data: {
              user_type: event.userType
            }
          }
        });
        
        if (error) throw error;
        
        toast.success('Registration successful! Please check your email to confirm your account.');
        return data;
      },
      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          toast.success('Logged out successfully');
          navigate('/');
        } catch (error: any) {
          console.error('Error during sign out:', error);
          // Even if API call fails, reset the local state
          return { success: true };
        }
      },
      fetchProfile: async (context) => {
        if (!context.user?.id) throw new Error('No user to fetch profile for');
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', context.user.id)
            .single();
            
          if (error) throw error;
          return data;
        } catch (error: any) {
          console.error('Error fetching user profile:', error);
          
          // Try to get user_type from user metadata instead
          const metadataUserType = context.user?.user_metadata?.user_type;
          if (metadataUserType) {
            return { user_type: metadataUserType };
          }
          
          throw error;
        }
      }
    },
    actions: {
      notifySuccess: (context, event) => {
        if (event.type === 'done.invoke.signUp') {
          toast.success('Registration successful! Please check your email to confirm your account.');
        }
      },
      notifyError: (context, event) => {
        if (event.error?.message) {
          toast.error(event.error.message);
        } else if (typeof event.error === 'string') {
          toast.error(event.error);
        } else {
          toast.error('An error occurred');
        }
      }
    }
  });

  // Initialize the auth machine by checking session
  const initialize = () => {
    send({ type: 'CHECK_SESSION' });
  };

  // Set up auth listener
  const setupAuthListener = () => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        send({ type: 'SET_SESSION', session });
      } else if (event === 'SIGNED_OUT') {
        send({ type: 'SET_SESSION', session: null });
      }
    });
    
    return data.subscription;
  };

  // Sign in method
  const signIn = async (email: string, password: string, userType: 'admin' | 'coach' | 'client') => {
    send({ type: 'SIGN_IN', email, password, userType });
  };

  // Sign up method
  const signUp = async (email: string, password: string, userType: 'admin' | 'coach' | 'client') => {
    send({ type: 'SIGN_UP', email, password, userType });
  };

  // Sign out method
  const signOut = async () => {
    send({ type: 'SIGN_OUT' });
  };

  return {
    send,
    initialize,
    setupAuthListener,
    signIn,
    signUp,
    signOut,
    // Derived state
    user: state.context.user,
    session: state.context.session,
    userType: state.context.userType,
    profile: state.context.profile,
    loading: state.context.loading,
    error: state.context.error,
    isAuthenticated: state.matches('authenticated'),
    isInitializing: state.matches('initializing') || state.matches('checkingSession'),
    isLoading: state.context.loading
  };
};
