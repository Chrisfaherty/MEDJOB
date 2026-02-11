'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // PKCE flow: Supabase sends ?code=... query parameter
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Auth code exchange error:', error);
            setError(error.message);
            return;
          }
        } else {
          // Implicit flow fallback: token in hash fragment
          // Supabase auto-detects hash tokens via getSession
          const { error } = await supabase.auth.getSession();
          if (error) {
            console.error('Auth callback error:', error);
            setError(error.message);
            return;
          }
        }
      } catch (err) {
        console.error('Auth callback failed:', err);
        setError((err as Error).message);
        return;
      }
      // Redirect to home
      router.replace('/');
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <p className="text-red-600 mb-4">Authentication error: {error}</p>
          <button
            onClick={() => router.replace('/')}
            className="text-blue-600 hover:underline"
          >
            Go to home page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}
