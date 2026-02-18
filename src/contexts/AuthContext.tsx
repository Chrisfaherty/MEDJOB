'use client';

/**
 * Authentication Context
 * Provides authentication state and methods to all components
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { authService, isSupabaseAuthConfigured } from '@/lib/auth';
import { localUserAPI, type User } from '@/lib/localStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  updateProfile: (updates: { name?: string; centile?: number }) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoRef = useRef(false);
  const useSupabase = isSupabaseAuthConfigured();

  useEffect(() => {
    if (useSupabase) {
      // When Supabase is configured, clear any leftover localStorage demo users
      // and use only Supabase sessions for authentication
      localUserAPI.logout();
      initializeSupabaseAuth();
    } else {
      // Local/dev mode: check localStorage for a local user
      const localUser = localUserAPI.getCurrentUser();
      if (localUser) {
        setUser(localUser);
        isDemoRef.current = true;
      }
      setLoading(false);
    }
  }, [useSupabase]);

  const initializeSupabaseAuth = async () => {
    try {
      const session = await authService.getSession();
      if (session) {
        await loadUserProfile();
      } else {
        setLoading(false);
      }

      // Listen for Supabase auth changes
      authService.onAuthStateChange(async (authUser) => {
        // Never override a demo/localStorage user
        if (isDemoRef.current) return;

        if (authUser) {
          await loadUserProfile();
        } else {
          setUser(null);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error initializing Supabase auth:', error);
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await authService.getCurrentUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password?: string) => {
    if (useSupabase) {
      if (!password) throw new Error('Password is required');
      await authService.signIn(email, password);
      isDemoRef.current = false;
      await loadUserProfile();
    } else {
      // Local dev mode — localStorage login
      const user = await localUserAPI.login(email);
      isDemoRef.current = true;
      setUser(user);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (useSupabase) {
      await authService.signUp(email, password, name);
      const session = await authService.getSession();
      if (session) {
        isDemoRef.current = false;
        await loadUserProfile();
      } else {
        // Email confirmation required — don't auto-login
        throw new Error('Please check your email to confirm your account before signing in.');
      }
    } else {
      const user = await localUserAPI.login(email);
      isDemoRef.current = true;
      setUser(user);
    }
  };

  const signOut = async () => {
    if (useSupabase && !isDemoRef.current) {
      try {
        await authService.signOut();
      } catch (error) {
        console.error('Supabase signOut error:', error);
      }
    }
    localUserAPI.logout();
    isDemoRef.current = false;
    setUser(null);
  };

  const signInWithMagicLink = async (email: string) => {
    if (useSupabase) {
      await authService.signInWithMagicLink(email);
    } else {
      throw new Error('Magic link is only available with Supabase');
    }
  };

  const updateProfile = async (updates: { name?: string; centile?: number }) => {
    if (useSupabase && !isDemoRef.current) {
      await authService.updateUserProfile(updates);
      await loadUserProfile();
    } else {
      console.warn('Profile updates not supported in demo mode');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithMagicLink,
        updateProfile,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
