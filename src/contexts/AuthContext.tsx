
import React, { createContext, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useAuthMachine } from '@/hooks/useAuthMachine';

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
  const {
    user,
    session,
    profile,
    userType,
    loading,
    initialize,
    setupAuthListener,
    signIn,
    signUp,
    signOut
  } = useAuthMachine();

  const navigate = useNavigate();

  // Setup auth listener and initialize on mount
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // First initialize the auth machine to check session
    initialize();
    
    // Then set up the auth state change listener
    const subscription = setupAuthListener();
    
    // Clean up the subscription on unmount
    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

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
