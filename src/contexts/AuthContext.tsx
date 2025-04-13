
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

  // Set up auth state listener and check for existing session
  useEffect(() => {
    console.log("Setting up auth state listener");
    setLoading(true);

    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.id);
        
        // Update session and user state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Extract userType from metadata if available
          const metadataUserType = currentSession.user.user_metadata?.user_type as UserType | undefined;
          if (metadataUserType) {
            console.log('User type found in metadata:', metadataUserType);
            setUserType(metadataUserType);
            
            // Still fetch profile for complete data, but don't block on it
            fetchUserProfile(currentSession.user.id);
          } else {
            // If not in metadata, we must fetch profile
            fetchUserProfile(currentSession.user.id);
          }
        } else {
          // No user session
          setProfile(null);
          setUserType(null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          toast.error('Failed to retrieve session');
          setLoading(false);
          return;
        }
        
        console.log('Initial session check:', existingSession?.user?.id);
        
        // Only set the session if we don't already have one
        // (the onAuthStateChange might have already fired)
        if (!session) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
          
          if (existingSession?.user) {
            const metadataUserType = existingSession.user.user_metadata?.user_type as UserType | undefined;
            
            if (metadataUserType) {
              console.log('User type found in metadata:', metadataUserType);
              setUserType(metadataUserType);
              fetchUserProfile(existingSession.user.id);
            } else {
              fetchUserProfile(existingSession.user.id);
            }
          } else {
            // No user session
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast.error('Failed to initialize authentication');
        setLoading(false);
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
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
        
        // Check if the error is because the profile doesn't exist
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId);
          
          // Try to get user_type from user metadata instead
          const { data: userData } = await supabase.auth.getUser();
          const metadataUserType = userData?.user?.user_metadata?.user_type as UserType | undefined;
          
          if (metadataUserType) {
            console.log('Using user_type from metadata:', metadataUserType);
            setUserType(metadataUserType);
          }
        } else {
          toast.error('Error fetching user profile');
        }
      } else if (data) {
        console.log('Profile loaded:', data);
        setProfile(data as Profile);
        setUserType(data.user_type as UserType);
      } else {
        console.warn('No profile found for user:', userId);
        
        // Try to get user_type from user metadata instead
        const { data: userData } = await supabase.auth.getUser();
        const metadataUserType = userData?.user?.user_metadata?.user_type as UserType | undefined;
        
        if (metadataUserType) {
          console.log('Using user_type from metadata:', metadataUserType);
          setUserType(metadataUserType);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      console.log('Profile fetch complete, resetting loading state');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      console.log(`Attempting to sign in with email: ${email} and userType: ${userType}`);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Authentication error:', error);
        toast.error(error.message || 'Failed to sign in');
        setLoading(false);
        return;
      }
      
      console.log('Sign in successful, user ID:', data.user?.id);
      toast.success('Sign in successful!');
      
      // User metadata should have the user_type, use it immediately for faster UI updates
      if (data.user?.user_metadata?.user_type) {
        const metadataUserType = data.user.user_metadata.user_type as UserType;
        console.log('Using user_type from metadata:', metadataUserType);
        setUserType(metadataUserType);
      }
      
      // The auth state listener will handle loading state reset
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('An error occurred during sign in');
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
        console.error('Authentication error:', error);
        toast.error(error.message || 'Failed to sign up');
        setLoading(false);
        return;
      }
      
      toast.success('Registration successful! Please check your email to confirm your account.');
      setLoading(false);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('An error occurred during sign up');
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Try to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        toast.error('An error occurred while signing out');
      } else {
        console.log('Successfully signed out from Supabase');
        
        // Reset auth state
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserType(null);
        
        navigate('/');
        toast.success('Logged out successfully');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('An error occurred while signing out');
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
