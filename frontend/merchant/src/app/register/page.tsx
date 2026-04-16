'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { renderGoogleButton } from '@/lib/googleIdentity';
import { useAuthStore } from '@/store/authStore';
import { authText } from '@shared/localization/auth';
import { getPostLoginRoute } from '@/lib/authRouting';

const t = authText('en');

export default function RegisterPage() {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const user = useAuthStore((s) => s.user);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const requestMagicLink = useAuthStore((s) => s.requestMagicLink);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setError('');
      setInfo('');
      setLoading(true);
      try {
        await loginWithGoogle(idToken, 'MERCHANT');
        const nextRoute = getPostLoginRoute(useAuthStore.getState().user);
        router.push(nextRoute);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      const result = await requestMagicLink(email, 'MERCHANT', `${window.location.origin}/auth/callback`);
      setInfo(t.magicLinkSent);
      if (result.debugLink) {
        setInfo(`${t.magicLinkSent} Dev link: ${result.debugLink}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || t.magicLinkFailed);
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
    router.replace(getPostLoginRoute(user));
  }, [router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant Signup</h1>
          <p className="text-gray-500 text-sm mt-1">Register with Google or email link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
          {error ? <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div> : null}
          {info ? <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2.5 text-sm">{info}</div> : null}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{t.emailLabel}</label>
            <input
              type="email"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@rapex.ph"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? 'Sending...' : t.continueWithEmail}
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

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link href="/login" className="text-primary-500 hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
