import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'; // Remove useRef
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
  authLoading: boolean;   // Represents overall auth + initial profile load state
  profileLoading: boolean; // Represents ongoing profile fetch state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // True until initial auth check is done
  const [profileLoading, setProfileLoading] = useState(false); // True specifically during profile fetch
  const navigate = useNavigate();

  // Define fetchUserProfile using useCallback
  const fetchUserProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    console.log('Fetching profile for user:', userId);
    // Reset profile/userType before fetching
    setProfile(null);
    setUserType(null);
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, user_type, created_at')
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        console.error('Error fetching user profile:', error);
        toast.error('Error fetching user profile');
        // State already cleared
      } else if (data) {
        console.log('Profile loaded:', data);
        setProfile(data as Profile);
        setUserType(data.user_type as UserType);
      } else {
        console.warn('No profile found for user:', userId, 'Status:', status);
         // State already cleared
      }
    } catch (error) {
      console.error('Exception during fetchUserProfile:', error);
      toast.error('An unexpected error occurred while fetching your profile.');
       // State already cleared
    } finally {
      setProfileLoading(false);
      // Note: authLoading is now primarily handled by the auth state listener effect
      console.log('Profile fetch attempt finished.');
    }
  }, []); // No dependencies needed

  // Effect for listening to Supabase auth changes
  useEffect(() => {
    setAuthLoading(true); // Start loading on initial setup
    console.log("Setting up auth state listener");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.id);

        // Update session and user state immediately
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        // Attempt to set userType from session data if available
        const sessionUserType = currentUser?.user_metadata?.user_type as UserType | undefined;
        if (sessionUserType) {
          console.log('Setting userType from session metadata:', sessionUserType);
          setUserType(sessionUserType);
        } else if (!currentUser) {
          // If user logs out or session is invalid, clear profile state here explicitly
          console.log('User signed out or no session, clearing profile and userType.');
          setProfile(null);
          setUserType(null);
          setProfileLoading(false); // Ensure profile loading stops
        } else {
          // User exists but no user_type in metadata, profile fetch will handle it.
          // Clear potentially stale userType if metadata didn't provide it.
          setUserType(null);
          console.log('User exists but user_type not found in session metadata. Profile fetch will handle.');
        }


        // Set authLoading to false once the initial check is done (session is known)
        // Profile loading is handled separately now.
        setAuthLoading(false);
        console.log('Auth check complete.');
      }
    );

    // Cleanup function
    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []); // Only run once on mount

  // Effect for fetching profile when user ID changes
  useEffect(() => {
    const userId = user?.id;
    if (userId) {
      console.log(`User ID detected: ${userId}. Triggering profile fetch.`);
      fetchUserProfile(userId); // This will fetch the definitive profile and userType
    } else {
      // Ensure profile is cleared if user becomes null after being set
      // This case is also handled in onAuthStateChange, but good to be defensive
      setProfile(null);
      setUserType(null);
      setProfileLoading(false); // Stop loading if user becomes null
    }
    // Adding fetchUserProfile to dependencies is important if it weren't stable (useCallback handles this)
  }, [user?.id, fetchUserProfile]);

  const signIn = async (email: string, password: string, userType: UserType) => {
    // Let the onAuthStateChange listener handle loading states
    console.log(`Attempting to sign in with email: ${email} and userType: ${userType}`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('Authentication error during sign in:', error);
        toast.error(error.message || 'Failed to sign in');
        return;
      }

      console.log('Sign in successful, user ID:', data.user?.id);
      toast.success('Sign in successful!');
      // The onAuthStateChange listener will trigger and handle state updates.

    } catch (error) {
      console.error('Exception during sign in:', error);
      toast.error('An error occurred during sign in');
    }
  };

  const signUp = async (email: string, password: string, userType: UserType) => {
    // Let the onAuthStateChange listener handle loading states if auth state changes
    console.log(`Attempting to sign up with email: ${email} and userType: ${userType}`);
    try {
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
        console.error('Authentication error during sign up:', error);
        toast.error(error.message || 'Failed to sign up');
        return;
      }

      // Sign up doesn't usually change the auth state immediately (needs confirmation)
      toast.success('Registration successful! Please check your email to confirm your account.');

    } catch (error) {
      console.error('Exception during sign up:', error);
      toast.error('An error occurred during sign up');
    }
  };

  const signOut = async () => {
    // Let the onAuthStateChange listener handle loading states
    console.log('Attempting to sign out');
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        // Log error but proceed with navigation/toast
        console.error('Error during Supabase sign out:', error);
        toast.error('Error signing out from server, clearing local session.');
      }

      // The onAuthStateChange listener will trigger with a null session
      // and handle resetting state (session, user, profile, userType, loading states).
      navigate('/'); // Navigate immediately
      toast.success('Logged out successfully');

    } catch (error) {
      console.error('Exception during sign out:', error);
      toast.error('An error occurred while signing out');
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
        // Combine authLoading and profileLoading for a simpler overall loading state?
        // Or keep them separate if you need to distinguish between auth check and profile fetch.
        // Let's keep them separate for now as the interface defines them separately.
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
