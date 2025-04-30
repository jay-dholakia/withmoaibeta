
import { useInterpret, useSelector } from '@xstate/react';
import { useNavigate } from 'react-router-dom';
import { authMachine } from '../machines/authMachine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ActorRefFrom } from 'xstate';

export const useAuthMachine = () => {
  const navigate = useNavigate();

  const authActor = useInterpret(authMachine, {
    services: {
      getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data;
      },
      signIn: async (_, { input }) => {
        if (input.type !== 'SIGN_IN') throw new Error('Invalid event');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password
        });
        
        if (error) throw error;
        
        // Check if user type matches the requested type
        const metadataUserType = data.user?.user_metadata?.user_type;
        if (metadataUserType && metadataUserType !== input.userType) {
          throw new Error(`This account is registered as a ${metadataUserType}, not as a ${input.userType}`);
        }
        
        toast.success('Sign in successful!');
        return data;
      },
      signUp: async (_, { input }) => {
        if (input.type !== 'SIGN_UP') throw new Error('Invalid event');
        
        const { data, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              user_type: input.userType
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
      fetchProfile: async ({ context }) => {
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
      notifySuccess: ({ event }) => {
        if (event.type === 'done.invoke.signUp') {
          toast.success('Registration successful! Please check your email to confirm your account.');
        }
      },
      notifyError: ({ event }) => {
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
    authActor.send({ type: 'CHECK_SESSION' });
  };

  // Set up auth listener
  const setupAuthListener = () => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        authActor.send({ type: 'SET_SESSION', session });
      } else if (event === 'SIGNED_OUT') {
        authActor.send({ type: 'SET_SESSION', session: null });
      }
    });
    
    return data.subscription;
  };

  // Sign in method
  const signIn = async (email: string, password: string, userType: 'admin' | 'coach' | 'client') => {
    authActor.send({ type: 'SIGN_IN', email, password, userType });
  };

  // Sign up method
  const signUp = async (email: string, password: string, userType: 'admin' | 'coach' | 'client') => {
    authActor.send({ type: 'SIGN_UP', email, password, userType });
  };

  // Sign out method
  const signOut = async () => {
    authActor.send({ type: 'SIGN_OUT' });
  };

  // Create selectors for each relevant state
  const user = useSelector(authActor, (state) => state.context.user);
  const session = useSelector(authActor, (state) => state.context.session);
  const userType = useSelector(authActor, (state) => state.context.userType);
  const profile = useSelector(authActor, (state) => state.context.profile);
  const loading = useSelector(authActor, (state) => state.context.loading);
  const error = useSelector(authActor, (state) => state.context.error);
  const isAuthenticated = useSelector(authActor, (state) => state.matches('authenticated'));
  const isInitializing = useSelector(authActor, (state) => 
    state.matches('initializing') || state.matches('checkingSession')
  );

  return {
    authActor,
    initialize,
    setupAuthListener,
    signIn,
    signUp,
    signOut,
    // Derived state
    user,
    session,
    userType,
    profile,
    loading,
    error,
    isAuthenticated,
    isInitializing,
    isLoading: loading
  };
};
