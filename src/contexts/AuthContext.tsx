
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
  authLoading: boolean;   // Renamed from loading to authLoading
  profileLoading: boolean; // New separate loading state for profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();

  // Set up auth state listener and check for existing session
  useEffect(() => {
    console.log("Setting up auth state listener");
    setAuthLoading(true);

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
            
            // Use setTimeout to defer the profile fetch to avoid potential Supabase auth deadlocks
            setTimeout(() => {
              fetchUserProfile(currentSession.user.id);
            }, 0);
          } else {
            // If not in metadata, we must fetch profile
            setTimeout(() => {
              fetchUserProfile(currentSession.user.id);
            }, 0);
          }
        } else {
          // No user session
          setProfile(null);
          setUserType(null);
          setAuthLoading(false);
        }
      }
    );


    // Cleanup function
    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
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
      console.log('Profile fetch complete, resetting loading states');
      setProfileLoading(false);
      setAuthLoading(false);
    }
  };

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      console.log(`Attempting to sign in with email: ${email} and userType: ${userType}`);
      setAuthLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Authentication error:', error);
        toast.error(error.message || 'Failed to sign in');
        setAuthLoading(false);
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
      setAuthLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userType: UserType) => {
    try {
      setAuthLoading(true);
      
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
        setAuthLoading(false);
        return;
      }
      
      toast.success('Registration successful! Please check your email to confirm your account.');
      setAuthLoading(false);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('An error occurred during sign up');
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthLoading(true);
      
      try {
        // Try to sign out from Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Error during sign out:', error);
          // Don't throw the error, just log it and continue with reset
        }
      } catch (error) {
        // Catch any errors with the signOut call
        console.error('Exception during sign out:', error);
        // Continue with local state reset even if the API call fails
      }
      
      // Always reset auth state regardless of API success
      setSession(null);
      setUser(null);
      setProfile(null);
      setUserType(null);
      
      navigate('/');
      toast.success('Logged out successfully');
      
      setAuthLoading(false);
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('An error occurred while signing out');
      setAuthLoading(false);
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
        authLoading,
        profileLoading
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
