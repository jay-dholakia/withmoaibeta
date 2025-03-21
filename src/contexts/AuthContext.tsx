
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
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setUserType(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Don't reset user state on profile fetch error
        // Just log the error and continue
        toast.error('Error fetching user profile');
        return;
      }

      if (data) {
        console.log('Profile loaded:', data);
        setProfile(data as Profile);
        setUserType(data.user_type as UserType);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      if (data.user) {
        // We'll wait for onAuthStateChange to fetch the profile and verify user type
        console.log('Sign in successful:', data.user.id);
        
        // Redirect based on user type after profile is verified in onAuthStateChange
        setTimeout(() => {
          if (userType === 'admin') {
            navigate('/admin-dashboard');
          } else if (userType === 'coach') {
            navigate('/coach-dashboard');
          } else {
            navigate('/client-dashboard');
          }
          toast.success(`Sign in successful!`);
        }, 500);
      }
    } catch (error) {
      console.error('Error in signIn:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
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
        return;
      }
      
      toast.success('Registration successful! Please check your email to confirm your account.');
      
    } catch (error) {
      console.error('Error in signUp:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('An error occurred while logging out');
    } finally {
      setLoading(false);
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
