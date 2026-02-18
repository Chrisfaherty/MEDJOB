'use client';

import { useState } from 'react';
import { Mail, X, Stethoscope, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-white rounded-3xl shadow-float max-w-md w-full max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-teal rounded-2xl flex items-center justify-center shadow-sm">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-apple-black">
                  {mode === 'signin' && 'Welcome Back'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-[12px] text-apple-secondary">
                  {mode === 'signin' && 'Sign in to MedMatch-IE'}
                  {mode === 'signup' && 'Get started with MedMatch-IE'}
                  {mode === 'forgot' && 'Recover your account'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100/80 rounded-xl transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-apple-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-6">
          {resetSent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-teal" />
              </div>
              <h3 className="text-[16px] font-semibold text-apple-black mb-2">Check Your Email</h3>
              <p className="text-[13px] text-apple-secondary mb-6 leading-relaxed">
                We've sent a password reset link to <strong className="text-apple-black">{email}</strong>
              </p>
              <button
                onClick={() => switchMode('signin')}
                className="text-[13px] text-teal hover:underline font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[12px] font-semibold text-apple-secondary uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. John Smith"
                      className="w-full pl-10 pr-4 py-3 text-[14px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="block text-[12px] font-semibold text-apple-secondary uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 text-[14px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              {mode !== 'forgot' && useSupabase && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-semibold text-apple-secondary uppercase tracking-wider">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-[11px] text-teal hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 text-[14px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="mt-1.5 text-[11px] text-apple-secondary">
                      Minimum 6 characters
                    </p>
                  )}
                </div>
              )}

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-50/80 border border-red-200/60 rounded-xl">
                      <p className="text-[13px] text-red-700">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !email || (useSupabase && mode !== 'forgot' && !password)}
                className="w-full py-3 bg-teal text-white text-[14px] font-semibold rounded-xl hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
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
                    className="text-[13px] text-apple-secondary"
                  >
                    {mode === 'signin' ? (
                      <>Don't have an account? <span className="text-teal hover:underline font-medium">Sign up</span></>
                    ) : (
                      <>Already have an account? <span className="text-teal hover:underline font-medium">Sign in</span></>
                    )}
                  </button>
                </div>
              )}

              {mode === 'forgot' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-[13px] text-apple-secondary"
                  >
                    Remember your password? <span className="text-teal hover:underline font-medium">Sign in</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Demo login */}
          {mode === 'signin' && !resetSent && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/60"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-[11px] text-apple-secondary uppercase tracking-wider font-medium">Or</span>
                </div>
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-3 border border-slate-200/80 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-apple-gray/50 transition-colors disabled:opacity-50 tracking-wide"
              >
                DEMO ACCOUNT
              </button>
            </>
          )}

          {/* Info */}
          {!resetSent && (
            <div className="mt-5 p-3.5 bg-apple-gray/50 rounded-xl border border-slate-200/30">
              <p className="text-[12px] text-apple-secondary leading-relaxed">
                {useSupabase ? (
                  <>
                    <strong className="text-apple-black">Cloud Sync:</strong> Your data syncs across devices and is securely stored.
                  </>
                ) : (
                  <>
                    <strong className="text-apple-black">Local Mode:</strong> Your data is stored locally in your browser.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-3 bg-apple-gray/30 rounded-b-3xl border-t border-slate-100">
          <p className="text-[11px] text-apple-secondary text-center">
            Built for Irish medical interns transitioning to SHO/REG roles
          </p>
        </div>
      </motion.div>
    </div>
  );
}
