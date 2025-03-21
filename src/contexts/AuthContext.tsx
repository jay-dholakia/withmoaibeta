import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserType = 'admin' | 'coach' | 'client';

interface Profile {
  id: string;
  user_type: UserType;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  userType: UserType | null;
  signIn: (email: string, password: string, userType: UserType) => Promise<void>;
  signUp: (email: string, password: string, userType: UserType) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Setting up auth state listener...");
    
    // Immediately set an initializing timeout to ensure the loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      console.log("Auth loading timeout triggered - resetting loading state");
      setLoading(false);
    }, 5000); // Fail-safe: reset loading after 5 seconds if nothing happens
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Clear the timeout since we received an auth event
        clearTimeout(loadingTimeout);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setUserType(null);
          setLoading(false); // Always ensure loading is reset when there's no user
        }
      }
    );

    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false); // Always ensure loading is reset when there's no user
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false); // Always ensure loading is reset on error
      }
    };

    checkSession();

    return () => {
      console.log("Cleaning up auth subscription");
      clearTimeout(loadingTimeout); // Clear timeout on cleanup
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      // Don't set loading to true here as it may already be true
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Error fetching user profile');
        setLoading(false); // Always reset loading on error
        return;
      }

      if (data) {
        console.log('Profile loaded:', data);
        setProfile(data as Profile);
        setUserType(data.user_type as UserType);
      } else {
        console.warn('No profile found for user:', userId);
      }
      
      setLoading(false); // Always reset loading after profile fetch attempt
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setLoading(false); // Always reset loading on error
    }
  };

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      console.log(`Attempting to sign in with email: ${email} and userType: ${userType}`);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error.message);
        toast.error(error.message);
        setLoading(false); // Explicit reset on error
        return;
      }
      
      console.log('Sign in successful, user ID:', data.user?.id);
      toast.success('Sign in successful!');
      
      // We don't need to explicitly set loading to false here as fetchUserProfile will handle that
      // or the auth state listener will do it 
      
      // But as a fallback, ensure loading is reset after a reasonable time
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error in signIn:', error);
      toast.error('An unexpected error occurred');
      setLoading(false); // Always reset loading on error
    }
  };

  const signUp = async (email: string, password: string, userType: UserType) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            user_type: userType
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      
      toast.success('Registration successful! Please check your email to confirm your account.');
      setLoading(false);
    } catch (error) {
      console.error('Error in signUp:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      // Reset all auth state immediately rather than waiting for the listener
      setSession(null);
      setUser(null);
      setProfile(null);
      setUserType(null);
      
      navigate('/');
      toast.success('Logged out successfully');
      
      setLoading(false);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('An error occurred while logging out');
      setLoading(false); // Always reset loading on error
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        userType,
        signIn,
        signUp,
        signOut,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
