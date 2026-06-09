'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { renderGoogleButton } from '@/lib/googleIdentity';
import { useAuthStore } from '@/store/authStore';
import { authText } from '@shared/localization/auth';

const t = authText('en');

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setError('');
      setInfo('');
      setLoading(true);
      try {
        await loginWithGoogle(idToken, 'RIDER');
        router.push('/orders');
      } catch (err: any) {
        const code = err?.response?.data?.errors?.code;
        if (code === 'role_mismatch') {
          setError(t.googleRoleConflict);
        } else {
          setError(err?.response?.data?.message || t.googleFailed);
        }
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, router],
  );

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier || !password) {
      setError('Email or username and password are required.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    try {
      await loginWithPassword(identifier, password, 'RIDER');
      router.push('/orders');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to login with password.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    renderGoogleButton(googleButtonRef.current, googleClientId, handleGoogleCredential).catch(() => {
      setError('Google Sign-In failed to initialize. Check your client ID setup.');
    });
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    if (!user) {
      return;
    }
    router.replace('/orders');
  }, [router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
          <h1 className="text-2xl font-bold text-gray-900">Rider Access</h1>
          <p className="text-gray-500 text-sm mt-1">Login with password or Google</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          {error ? <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div> : null}
          {info ? <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2.5 text-sm">{info}</div> : null}

          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{t.identifierLabel}</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
              placeholder="Username"
              required
            />
            <label className="block text-sm font-medium text-gray-700">{t.passwordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
              placeholder="Enter your password"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? 'Signing in...' : t.continueWithPassword}
            </button>
          </form>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            <span>or</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="flex justify-center">
            <div ref={googleButtonRef} />
          </div>

          <p className="text-center text-sm text-gray-500 mt-2">
            Don't have an account yet? <Link href="/register" className="text-primary-500 font-medium hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
