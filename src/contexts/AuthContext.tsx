
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
  const [unmounted, setUnmounted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Helper function to safely update state only if component is still mounted
  const safeSetState = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    if (!unmounted) {
      setter(value);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener...");
    
    // Critical flag to track component mount state
    setUnmounted(false);
    
    // Immediately set an initializing timeout to ensure the loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      console.log("Auth loading timeout triggered - resetting loading state");
      safeSetState(setLoading, false);
    }, 5000); // Fail-safe: reset loading after 5 seconds if nothing happens
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Clear the timeout since we received an auth event
        clearTimeout(loadingTimeout);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
          setAuthError(null);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out - clearing auth state');
          safeSetState(setSession, null);
          safeSetState(setUser, null);
          safeSetState(setProfile, null);
          safeSetState(setUserType, null);
          safeSetState(setLoading, false);
          return;
        }
        
        safeSetState(setSession, session);
        safeSetState(setUser, session?.user ?? null);
        
        if (session?.user) {
          // Extract userType directly from user metadata if available
          const metadataUserType = session.user.user_metadata?.user_type as UserType | undefined;
          
          if (metadataUserType) {
            console.log('User type found in metadata:', metadataUserType);
            safeSetState(setUserType, metadataUserType);
            // Still fetch profile for complete data, but don't block on it
            fetchUserProfile(session.user.id).catch(err => {
              console.error('Error fetching profile after auth state change:', err);
            });
          } else {
            // If not in metadata, we must fetch profile
            try {
              await fetchUserProfile(session.user.id);
            } catch (error) {
              console.error('Error fetching profile:', error);
            } finally {
              // Always ensure loading is reset after trying to fetch profile
              safeSetState(setLoading, false);
            }
          }
        } else {
          safeSetState(setProfile, null);
          safeSetState(setUserType, null);
          safeSetState(setLoading, false); // Always ensure loading is reset when there's no user
        }
      }
    );

    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthError('Failed to retrieve session');
          safeSetState(setLoading, false);
          return;
        }
        
        console.log('Initial session check:', session?.user?.id);
        
        if (!unmounted) {
          safeSetState(setSession, session);
          safeSetState(setUser, session?.user ?? null);
          
          if (session?.user) {
            // Extract userType directly from user metadata if available
            const metadataUserType = session.user.user_metadata?.user_type as UserType | undefined;
            
            if (metadataUserType) {
              console.log('User type found in metadata:', metadataUserType);
              safeSetState(setUserType, metadataUserType);
              // Still fetch profile but don't block on it
              fetchUserProfile(session.user.id).catch(err => {
                console.error('Error fetching profile after session check:', err);
              });
              safeSetState(setLoading, false);
            } else {
              // If not in metadata, we must fetch profile
              try {
                await fetchUserProfile(session.user.id);
              } catch (error) {
                console.error('Error fetching profile:', error);
              } finally {
                // Always ensure loading is reset
                safeSetState(setLoading, false);
              }
            }
          } else {
            // No user session
            safeSetState(setLoading, false);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setAuthError('Failed to initialize authentication');
        safeSetState(setLoading, false); // Always ensure loading is reset on error
      }
    };

    checkSession();

    return () => {
      console.log("Cleaning up auth subscription");
      setUnmounted(true); // Mark component as unmounted
      clearTimeout(loadingTimeout); // Clear timeout on cleanup
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
            safeSetState(setUserType, metadataUserType);
          }
        } else {
          toast.error('Error fetching user profile');
        }
        
        return;
      }

      if (data) {
        console.log('Profile loaded:', data);
        safeSetState(setProfile, data as Profile);
        safeSetState(setUserType, data.user_type as UserType);
      } else {
        console.warn('No profile found for user:', userId);
        
        // Try to get user_type from user metadata instead
        const { data: userData } = await supabase.auth.getUser();
        const metadataUserType = userData?.user?.user_metadata?.user_type as UserType | undefined;
        
        if (metadataUserType) {
          console.log('Using user_type from metadata:', metadataUserType);
          safeSetState(setUserType, metadataUserType);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Don't reset loading here, let the caller handle it
    } finally {
      console.log('Profile fetch complete, resetting loading state');
      safeSetState(setLoading, false); // Always reset loading after profile fetch attempt
    }
  };

  const handleAuthError = (error: any) => {
    console.error('Authentication error:', error);
    
    // Handle specific error cases
    if (error.message?.includes("Invalid Refresh Token")) {
      setAuthError('Your session has expired. Please sign in again.');
      toast.error('Your session has expired. Please sign in again.');
      // Force sign out to clear any problematic tokens
      supabase.auth.signOut().catch(e => console.error('Error during forced sign-out:', e));
      navigate('/');
    } else {
      toast.error(error.message || 'An authentication error occurred');
    }
    
    safeSetState(setLoading, false);
  };

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      console.log(`Attempting to sign in with email: ${email} and userType: ${userType}`);
      safeSetState(setLoading, true);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        handleAuthError(error);
        return;
      }
      
      console.log('Sign in successful, user ID:', data.user?.id);
      toast.success('Sign in successful!');
      
      // User metadata should have the user_type, use it immediately for faster UI updates
      if (data.user?.user_metadata?.user_type) {
        const metadataUserType = data.user.user_metadata.user_type as UserType;
        console.log('Using user_type from metadata:', metadataUserType);
        safeSetState(setUserType, metadataUserType);
      }
      
      // We don't need to explicitly set loading to false here as the auth state listener will handle that
      // But as a fallback, ensure loading is reset after a reasonable time
      setTimeout(() => {
        safeSetState(setLoading, false);
      }, 2000);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signUp = async (email: string, password: string, userType: UserType) => {
    try {
      safeSetState(setLoading, true);
      setAuthError(null);
      
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
        handleAuthError(error);
        return;
      }
      
      toast.success('Registration successful! Please check your email to confirm your account.');
      safeSetState(setLoading, false);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signOut = async () => {
    try {
      safeSetState(setLoading, true);
      setAuthError(null);
      
      // Reset all auth state immediately before attempting to sign out
      // This ensures UI updates even if the signOut call fails
      safeSetState(setSession, null);
      safeSetState(setUser, null);
      safeSetState(setProfile, null);
      safeSetState(setUserType, null);
      
      // Try to sign out, but handle errors gracefully
      try {
        await supabase.auth.signOut();
        console.log('Successfully signed out from Supabase');
      } catch (signOutError) {
        // Just log the error, don't throw, since we've already reset the state
        console.error('Error during Supabase signOut:', signOutError);
      }
      
      navigate('/');
      toast.success('Logged out successfully');
      
      safeSetState(setLoading, false);
    } catch (error) {
      handleAuthError(error);
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
      {authError && !user && (
        <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded shadow-md">
          {authError}
          <button 
            className="ml-2 font-bold"
            onClick={() => {
              setAuthError(null);
              navigate('/');
            }}
          >
            ×
          </button>
        </div>
      )}
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
