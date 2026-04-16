'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { renderGoogleButton } from '@/lib/googleIdentity';
import { useAuthStore } from '@/store/authStore';
import { authText } from '@shared/localization/auth';

const t = authText('en');

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const requestMagicLink = useAuthStore((s) => s.requestMagicLink);
  const verifyMagicLink = useAuthStore((s) => s.verifyMagicLink);

  const [email, setEmail] = useState('');
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
        await loginWithGoogle(idToken, 'ADMIN');
        router.push('/dashboard');
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

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    try {
      const result = await requestMagicLink(email, 'ADMIN', `${window.location.origin}/register`);
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
    const token = params.get('token');
    const magicEmail = params.get('email');
    const role = params.get('role') || 'ADMIN';
    if (!token || !magicEmail) {
      return;
    }

    let isMounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await verifyMagicLink(magicEmail, token, role);
        if (isMounted) {
          router.replace('/dashboard');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || t.magicLinkVerifyFailed);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      isMounted = false;
    };
  }, [params, router, verifyMagicLink]);

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
    router.replace('/dashboard');
  }, [router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
          <h1 className="text-2xl font-bold text-gray-900">Create Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">Use Google or request an email magic link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          {error ? <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div> : null}
          {info ? <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2.5 text-sm">{info}</div> : null}

          <form onSubmit={handleMagicLink} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{t.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
              placeholder="admin@rapex.ph"
              required
            />
            <p className="text-xs text-gray-500">{t.emailOnlyHint}</p>
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

          <p className="text-center text-sm text-gray-500 mt-2">
            Already have access? <Link href="/login" className="text-primary-500 font-medium hover:underline">Open admin login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
