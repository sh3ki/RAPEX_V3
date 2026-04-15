'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { renderGoogleButton } from '@/lib/googleIdentity';

export default function RegisterPage() {
  const router = useRouter();
  const signupWithGoogle = useAuthStore((s) => s.signupWithGoogle);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const requestOtp = async () => {
    if (!phone) {
      setError('Enter your phone number first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/otp/request/', { phone, purpose: 'REGISTRATION' });
      setOtpSent(true);
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      if (!phone || !otpCode) {
        setError('Phone number and OTP are required before Google signup.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        await signupWithGoogle({
          idToken,
          role: 'RIDER',
          phone,
          otpCode,
          fullName,
        });
        router.push('/orders');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Google signup failed.');
      } finally {
        setLoading(false);
      }
    },
    [fullName, otpCode, phone, router, signupWithGoogle],
  );

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    renderGoogleButton(googleButtonRef.current, googleClientId, handleGoogleCredential)
      .catch(() => setError('Google Sign-Up failed to initialize. Check your client ID setup.'));
  }, [googleClientId, handleGoogleCredential]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
          <h1 className="text-2xl font-bold text-gray-900">Create Rider Account</h1>
          <p className="text-gray-500 text-sm mt-1">Sign up with Google and verify phone OTP</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name (optional)</label>
            <input
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09171234567"
              required
            />
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-center text-gray-900 text-sm tracking-[0.4em]"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              placeholder="------"
              required
            />
            <button
              type="button"
              className="px-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
              onClick={requestOtp}
              disabled={loading}
            >
              {loading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>

          <p className="text-xs text-gray-500">Enter OTP, then continue with Google.</p>

          <div className="flex justify-center">
            <div ref={googleButtonRef} />
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link href="/login" className="text-primary-500 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
