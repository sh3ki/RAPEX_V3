'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { renderGoogleButton } from '@/lib/googleIdentity';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuthStore();
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setLoading(true);
      setError('');
      try {
        await loginWithGoogle(idToken, 'SUPERADMIN');
        router.push('/dashboard');
      } catch (err: any) {
        const code = err?.response?.data?.errors?.code;
        if (code === 'google_signup_required') {
          setError('No superadmin account is linked to this Google email yet. Please sign up first.');
        } else {
          setError(err?.response?.data?.message || 'Google login failed.');
        }
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, router],
  );

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    renderGoogleButton(googleButtonRef.current, googleClientId, handleGoogleCredential)
      .catch(() => setError('Google Sign-In failed to initialize. Check your client ID setup.'));
  }, [googleClientId, handleGoogleCredential]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to RAPEX Super Admin</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
                placeholder="superadmin@rapex.ph" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              <span>or</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="flex justify-center">
              <div ref={googleButtonRef} />
            </div>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Need a new account? <Link href="/register" className="text-primary-500 font-medium hover:underline">Sign up with Google</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
