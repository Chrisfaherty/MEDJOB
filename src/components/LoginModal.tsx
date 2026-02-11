'use client';

import { useState } from 'react';
import { Mail, X, Briefcase, Lock, User, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseAuthConfigured } from '@/lib/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn, signUp } = useAuth();
  const useSupabase = isSupabaseAuthConfigured();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        await signIn(email, useSupabase ? password : undefined);
        onClose();
        setEmail('');
        setPassword('');
      } else if (mode === 'signup') {
        if (!name || !password) {
          setError('Please fill in all fields');
          return;
        }
        await signUp(email, password, name);
        onClose();
        setEmail('');
        setPassword('');
        setName('');
      } else if (mode === 'forgot') {
        // Password reset - will be handled by authService
        const { authService } = await import('@/lib/auth');
        await authService.resetPassword(email);
        setResetSent(true);
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('intern.demo@hse.ie');
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setResetSent(false);
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-linkedin-blue to-linkedin-blue-light rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                  {mode === 'signin' && 'Welcome Back'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {mode === 'signin' && 'Sign in to your account'}
                  {mode === 'signup' && 'Get started with MedJob'}
                  {mode === 'forgot' && 'Recover your account'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-8 py-4 sm:py-6">
          {resetSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Check Your Email</h3>
              <p className="text-sm text-slate-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => switchMode('signin')}
                className="text-linkedin-blue hover:underline text-sm"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. John Smith"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password field (not in forgot mode) */}
              {mode !== 'forgot' && useSupabase && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-linkedin-blue hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="mt-1 text-xs text-slate-500">
                      Minimum 6 characters
                    </p>
                  )}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !email || (useSupabase && mode !== 'forgot' && !password)}
                className="w-full py-3 bg-linkedin-blue text-white font-medium rounded-lg hover:bg-linkedin-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>
                      {mode === 'signin' && 'Signing in...'}
                      {mode === 'signup' && 'Creating account...'}
                      {mode === 'forgot' && 'Sending reset link...'}
                    </span>
                  </>
                ) : (
                  <>
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </>
                )}
              </button>

              {/* Mode toggle */}
              {mode !== 'forgot' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-sm text-slate-600"
                  >
                    {mode === 'signin' ? (
                      <>
                        Don't have an account?{' '}
                        <span className="text-linkedin-blue hover:underline">Sign up</span>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <span className="text-linkedin-blue hover:underline">Sign in</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {mode === 'forgot' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-sm text-slate-600"
                  >
                    Remember your password?{' '}
                    <span className="text-linkedin-blue hover:underline">Sign in</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Demo login (only in signin mode, not in forgot mode) */}
          {mode === 'signin' && !resetSent && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or</span>
                </div>
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                DEMO ACCOUNT
              </button>
            </>
          )}

          {/* Info */}
          {!resetSent && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                {useSupabase ? (
                  <>
                    <strong>Supabase Mode:</strong> Your data syncs across devices and is securely stored.
                  </>
                ) : (
                  <>
                    <strong>Local Mode:</strong> Your data is stored locally in your browser.
                    Add Supabase credentials to enable cloud sync.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 bg-slate-50 rounded-b-2xl border-t border-slate-200">
          <p className="text-xs text-slate-600 text-center">
            Built for Irish medical interns transitioning to SHO/REG roles
          </p>
        </div>
      </div>
    </div>
  );
}
