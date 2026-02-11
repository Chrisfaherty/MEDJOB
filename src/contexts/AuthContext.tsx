'use client';

/**
 * Authentication Context
 * Provides authentication state and methods to all components
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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
  const useSupabase = isSupabaseAuthConfigured();

  useEffect(() => {
    if (useSupabase) {
      // Supabase authentication
      initializeSupabaseAuth();
    } else {
      // localStorage fallback (existing behavior)
      initializeLocalAuth();
    }
  }, [useSupabase]);

  const initializeSupabaseAuth = async () => {
    try {
      // Check active session
      const session = await authService.getSession();
      if (session) {
        await loadUserProfile();
      } else {
        setLoading(false);
      }

      // Listen for auth changes
      const subscription = authService.onAuthStateChange(async (authUser) => {
        if (authUser) {
          await loadUserProfile();
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing Supabase auth:', error);
      setLoading(false);
    }
  };

  const initializeLocalAuth = () => {
    // Use existing localStorage auth
    const localUser = localUserAPI.getCurrentUser();
    setUser(localUser);
    setLoading(false);
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
    if (useSupabase && password) {
      // Full Supabase authentication with password
      await authService.signIn(email, password);
      await loadUserProfile();
    } else {
      // localStorage login (demo mode or no password provided)
      const user = await localUserAPI.login(email);
      setUser(user);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (useSupabase) {
      await authService.signUp(email, password, name);
      // User will be logged in automatically after email confirmation
      await loadUserProfile();
    } else {
      // localStorage fallback - just login (no password)
      const user = await localUserAPI.login(email);
      setUser(user);
    }
  };

  const signOut = async () => {
    if (useSupabase) {
      await authService.signOut();
      setUser(null);
    } else {
      localUserAPI.logout();
      setUser(null);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    if (useSupabase) {
      await authService.signInWithMagicLink(email);
      // User will be redirected back after clicking magic link
    } else {
      throw new Error('Magic link is only available with Supabase');
    }
  };

  const updateProfile = async (updates: { name?: string; centile?: number }) => {
    if (useSupabase) {
      await authService.updateUserProfile(updates);
      await loadUserProfile();
    } else {
      // localStorage doesn't support profile updates yet
      console.warn('Profile updates not supported with localStorage');
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
