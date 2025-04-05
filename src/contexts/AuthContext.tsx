import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';

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

const showToastError = debounce((message: string) => {
  toast.error(message);
}, 2000);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [unmounted, setUnmounted] = useState(false);
  const navigate = useNavigate();

  const safeSetState = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    if (!unmounted) {
      setter(value);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener...");
    
    setUnmounted(false);
    
    let authRetryCount = 0;
    const MAX_RETRIES = 3;
    
    const loadingTimeout = setTimeout(() => {
      console.log("Auth loading timeout triggered - resetting loading state");
      safeSetState(setLoading, false);
    }, 5000);
    
    let activeSubscription: { data: { subscription: any } } | null = null;
    
    try {
      activeSubscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          clearTimeout(loadingTimeout);
          
          if (event === 'SIGNED_OUT' as AuthChangeEvent) {
            console.log('User signed out, clearing auth state');
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
            const metadataUserType = session.user.user_metadata?.user_type as UserType | undefined;
            
            if (metadataUserType) {
              console.log('User type found in metadata:', metadataUserType);
              safeSetState(setUserType, metadataUserType);
              
              fetchUserProfile(session.user.id)
                .catch(err => {
                  console.error('Error fetching profile after auth state change:', err);
                  if (!isNetworkError(err)) {
                    showToastError('Error loading your profile data');
                  }
                })
                .finally(() => {
                  safeSetState(setLoading, false);
                });
            } else {
              fetchUserProfile(session.user.id)
                .catch(err => {
                  console.error('Error fetching profile:', err);
                  if (authRetryCount < MAX_RETRIES && isNetworkError(err)) {
                    console.log(`Retrying profile fetch (${authRetryCount + 1}/${MAX_RETRIES})...`);
                    authRetryCount++;
                    setTimeout(() => {
                      if (!unmounted) {
                        fetchUserProfile(session.user.id)
                          .catch(retryErr => console.error('Retry failed:', retryErr))
                          .finally(() => safeSetState(setLoading, false));
                      }
                    }, 1000 * authRetryCount);
                  } else {
                    safeSetState(setLoading, false);
                  }
                })
                .finally(() => {
                  if (authRetryCount === 0) {
                    safeSetState(setLoading, false);
                  }
                });
            }
          } else if (event !== 'SIGNED_OUT' as AuthChangeEvent) {
            safeSetState(setLoading, false);
          }
        }
      );
    } catch (err) {
      console.error("Error setting up auth listener:", err);
      safeSetState(setLoading, false);
    }

    const checkSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 5000);
        });
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          console.error('Error getting session:', error);
          safeSetState(setLoading, false);
          return;
        }
        
        console.log('Initial session check:', session?.user?.id);
        
        if (!unmounted) {
          safeSetState(setSession, session);
          safeSetState(setUser, session?.user ?? null);
          
          if (session?.user) {
            const metadataUserType = session.user.user_metadata?.user_type as UserType | undefined;
            
            if (metadataUserType) {
              console.log('User type found in metadata:', metadataUserType);
              safeSetState(setUserType, metadataUserType);
              fetchUserProfile(session.user.id)
                .catch(err => {
                  console.error('Error fetching profile after session check:', err);
                  if (!isNetworkError(err)) {
                    showToastError('Error loading your profile data');
                  }
                })
                .finally(() => {
                  safeSetState(setLoading, false);
                });
            } else {
              try {
                await fetchUserProfile(session.user.id);
              } catch (error) {
                console.error('Error fetching profile:', error);
              } finally {
                safeSetState(setLoading, false);
              }
            }
          } else {
            safeSetState(setLoading, false);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        safeSetState(setLoading, false);
      }
    };

    checkSession();

    return () => {
      console.log("Cleaning up auth subscription");
      setUnmounted(true);
      clearTimeout(loadingTimeout);
      
      if (activeSubscription?.data?.subscription) {
        console.log("Unsubscribing from auth state changes");
        activeSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const isNetworkError = (error: any): boolean => {
    return (
      error.message?.includes('network') ||
      error.message?.includes('timeout') ||
      error.message?.includes('abort') ||
      error.message?.includes('ERR_') ||
      error.message?.includes('fetch') ||
      error.message?.includes('connection') ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT'
    );
  };

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
        
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId);
          
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
        
        const { data: userData } = await supabase.auth.getUser();
        const metadataUserType = userData?.user?.user_metadata?.user_type as UserType | undefined;
        
        if (metadataUserType) {
          console.log('Using user_type from metadata:', metadataUserType);
          safeSetState(setUserType, metadataUserType);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      console.log(`Attempting to sign in with email: ${email} and userType: ${userType}`);
      safeSetState(setLoading, true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error.message);
        toast.error(error.message);
        safeSetState(setLoading, false);
        return;
      }
      
      console.log('Sign in successful, user ID:', data.user?.id);
      toast.success('Sign in successful!');
      
      if (data.user?.user_metadata?.user_type) {
        const metadataUserType = data.user.user_metadata.user_type as UserType;
        console.log('Using user_type from metadata:', metadataUserType);
        safeSetState(setUserType, metadataUserType);
      }
      
      setTimeout(() => {
        safeSetState(setLoading, false);
      }, 2000);
    } catch (error) {
      console.error('Error in signIn:', error);
      toast.error('An unexpected error occurred');
      safeSetState(setLoading, false);
    }
  };

  const signUp = async (email: string, password: string, userType: UserType) => {
    try {
      safeSetState(setLoading, true);
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
        safeSetState(setLoading, false);
        return;
      }
      
      toast.success('Registration successful! Please check your email to confirm your account.');
      safeSetState(setLoading, false);
    } catch (error) {
      console.error('Error in signUp:', error);
      toast.error('An unexpected error occurred');
      safeSetState(setLoading, false);
    }
  };

  const signOut = async () => {
    try {
      safeSetState(setLoading, true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        toast.error('An error occurred while logging out');
        safeSetState(setLoading, false);
        return;
      }
      
      safeSetState(setSession, null);
      safeSetState(setUser, null);
      safeSetState(setProfile, null);
      safeSetState(setUserType, null);
      
      navigate('/');
      toast.success('Logged out successfully');
      
      safeSetState(setLoading, false);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('An error occurred while logging out');
      safeSetState(setLoading, false);
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
