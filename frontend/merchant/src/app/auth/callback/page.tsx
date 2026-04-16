'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { authText } from '@shared/localization/auth';
import { getPostLoginRoute } from '@/lib/authRouting';

const t = authText('en');

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const verifyMagicLink = useAuthStore((s) => s.verifyMagicLink);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = params.get('token');
    const magicEmail = params.get('email');
    const role = params.get('role') || 'MERCHANT';

    if (!token || !magicEmail) {
      setError(t.magicLinkVerifyFailed);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const run = async () => {
      try {
        await verifyMagicLink(magicEmail, token, role);
        if (!isMounted) {
          return;
        }
        const nextRoute = getPostLoginRoute(useAuthStore.getState().user);
        router.replace(nextRoute);
      } catch (err: any) {
        if (!isMounted) {
          return;
        }
        setError(err?.response?.data?.message || t.magicLinkVerifyFailed);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4 text-center">
        {loading ? <p className="text-sm text-gray-600">Verifying your magic link...</p> : null}
        {error ? (
          <>
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div>
            <p className="text-sm text-gray-500">
              <Link href="/register" className="text-primary-500 hover:underline">Return to signup</Link>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
