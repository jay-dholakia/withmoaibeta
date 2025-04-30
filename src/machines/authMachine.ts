
import { createMachine, assign } from 'xstate';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define interfaces for the context
export interface AuthContext {
  user: User | null;
  session: Session | null;
  userType: 'admin' | 'coach' | 'client' | null;
  profile: any | null;
  error: string | null;
  loading: boolean;
  redirectTo: string | null;
}

// Define the possible authentication events
export type AuthEvent =
  | { type: 'SIGN_IN'; email: string; password: string; userType: 'admin' | 'coach' | 'client' }
  | { type: 'SIGN_UP'; email: string; password: string; userType: 'admin' | 'coach' | 'client' }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_SESSION'; session: Session | null }
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_USER_TYPE'; userType: 'admin' | 'coach' | 'client' | null }
  | { type: 'SET_PROFILE'; profile: any }
  | { type: 'CHECK_SESSION' }
  | { type: 'SESSION_FOUND'; session: Session }
  | { type: 'NO_SESSION' }
  | { type: 'FETCH_PROFILE_SUCCESS'; profile: any }
  | { type: 'FETCH_PROFILE_ERROR' };

// Create the authentication state machine
export const authMachine = createMachine({
  id: 'auth',
  initial: 'initializing',
  context: {
    user: null,
    session: null,
    userType: null,
    profile: null,
    error: null,
    loading: true,
    redirectTo: null
  } as AuthContext,
  states: {
    initializing: {
      entry: assign({ loading: true }),
      on: {
        CHECK_SESSION: {
          target: 'checkingSession'
        },
        SET_SESSION: {
          target: 'authenticated',
          actions: assign({
            session: (_, event: { type: string, session: Session | null }) => event.session,
            user: (_, event: { type: string, session: Session | null }) => event.session?.user || null,
            loading: (_) => false
          })
        }
      }
    },
    checkingSession: {
      invoke: {
        src: 'getSession',
        onDone: {
          target: 'authenticated',
          actions: assign({
            session: (_, event) => event.data.session,
            user: (_, event) => event.data.session?.user || null,
            loading: (_) => false
          })
        },
        onError: {
          target: 'unauthenticated',
          actions: assign({ 
            error: (_, event) => event.data?.message || 'Failed to get session',
            loading: (_) => false
          })
        }
      }
    },
    unauthenticated: {
      entry: assign({
        user: null,
        session: null,
        userType: null,
        profile: null,
        loading: false
      }),
      on: {
        SIGN_IN: {
          target: 'signingIn'
        },
        SIGN_UP: {
          target: 'signingUp'
        },
        SET_SESSION: {
          target: 'authenticated',
          actions: assign({
            session: (_, event: { type: string, session: Session | null }) => event.session,
            user: (_, event: { type: string, session: Session | null }) => event.session?.user || null
          })
        }
      }
    },
    signingIn: {
      entry: assign({ loading: true, error: null }),
      invoke: {
        src: 'signIn',
        onDone: {
          target: 'authenticated',
          actions: assign({
            session: (_, event) => event.data.session,
            user: (_, event) => event.data.user,
            loading: (_) => false
          })
        },
        onError: {
          target: 'unauthenticated',
          actions: [
            assign({ 
              error: (_, event) => event.data?.message || 'Failed to sign in',
              loading: (_) => false
            }),
            'notifyError'
          ]
        }
      }
    },
    signingUp: {
      entry: assign({ loading: true, error: null }),
      invoke: {
        src: 'signUp',
        onDone: {
          target: 'authenticated',
          actions: [
            assign({
              session: (_, event) => event.data.session,
              user: (_, event) => event.data.user,
              loading: (_) => false
            }),
            'notifySuccess'
          ]
        },
        onError: {
          target: 'unauthenticated',
          actions: [
            assign({ 
              error: (_, event) => event.data?.message || 'Failed to sign up',
              loading: (_) => false
            }),
            'notifyError'
          ]
        }
      }
    },
    authenticated: {
      entry: assign({ loading: false }),
      on: {
        SIGN_OUT: {
          target: 'signingOut'
        },
        SET_USER_TYPE: {
          actions: assign({
            userType: (_, event: { type: string, userType: 'admin' | 'coach' | 'client' | null }) => event.userType
          })
        },
        SET_PROFILE: {
          actions: assign({
            profile: (_, event: { type: string, profile: any }) => event.profile
          })
        }
      },
      always: {
        target: 'fetchingProfile',
        cond: (context) => !!context.user && !context.profile && !context.userType
      }
    },
    fetchingProfile: {
      invoke: {
        src: 'fetchProfile',
        onDone: {
          target: 'authenticated',
          actions: assign({
            profile: (_, event) => event.data,
            userType: (_, event) => event.data?.user_type || null
          })
        },
        onError: {
          target: 'authenticated',
          actions: [
            assign({ error: (_, event) => event.data?.message || 'Failed to fetch profile' }),
            'notifyError'
          ]
        }
      }
    },
    signingOut: {
      entry: assign({ loading: true }),
      invoke: {
        src: 'signOut',
        onDone: {
          target: 'unauthenticated',
          actions: assign({
            user: null,
            session: null,
            userType: null,
            profile: null,
            loading: false
          })
        },
        onError: {
          target: 'authenticated',
          actions: [
            assign({ 
              error: (_, event) => event.data?.message || 'Failed to sign out',
              loading: (_) => false
            }),
            'notifyError'
          ]
        }
      }
    }
  }
});
