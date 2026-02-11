/**
 * Supabase Authentication Service
 * Handles all authentication operations including sign-up, login, password reset
 */

import { supabase } from './supabase';
import type { User } from './localStorage';

export const authService = {
  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with magic link (passwordless)
   */
  async signInWithMagicLink(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Get current user with profile information
   */
  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    return user;
  },

  /**
   * Get current user profile from user_profiles table
   */
  async getCurrentUserProfile(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      // Profile missing (trigger may not have fired) — create it from auth metadata
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: 'user',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return null;
        }

        return {
          id: newProfile.id,
          email: newProfile.email,
          name: newProfile.name,
          role: newProfile.role as 'admin' | 'user',
          createdAt: newProfile.created_at,
        };
      }
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as 'admin' | 'user',
      createdAt: profile.created_at,
    };
  },

  /**
   * Listen to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChange(callback: (user: any) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      callback(session?.user ?? null);
    });

    return subscription;
  },

  /**
   * Request password reset email
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  },

  /**
   * Update user password (must be authenticated)
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  /**
   * Update user profile information
   */
  async updateUserProfile(updates: {
    name?: string;
    centile?: number;
    current_grade?: string;
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  },

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    const profile = await this.getCurrentUserProfile();
    return profile?.role === 'admin';
  },

  /**
   * Refresh the current session
   */
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Update user email (requires confirmation)
   */
  async updateEmail(newEmail: string) {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) throw error;
  },

  /**
   * Resend confirmation email
   */
  async resendConfirmationEmail(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;
  },
};

/**
 * Helper function to check if Supabase auth is configured
 */
export function isSupabaseAuthConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
