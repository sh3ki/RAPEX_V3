'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { renderGoogleButton } from '@/lib/googleIdentity';

export default function RegisterPage() {
  const router = useRouter();
  const signupWithGoogle = useAuthStore((s) => s.signupWithGoogle);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
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
          role: 'USER',
          phone,
          otpCode,
          fullName,
        });
        router.push('/');
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-500 mb-1">RAPEX</h1>
          <p className="text-dark-muted text-sm">Create your account with Google</p>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Full Name (optional)</label>
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan Dela Cruz" />
          </div>
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Phone Number</label>
            <input className="input" placeholder="09171234567" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-center text-xl tracking-[0.4em]"
              maxLength={6}
              placeholder="------"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              required
            />
            <button type="button" className="btn-primary px-4" disabled={loading} onClick={requestOtp}>
              {loading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>
          <p className="text-xs text-dark-muted">Enter OTP then continue with Google.</p>
          <div className="flex justify-center">
            <div ref={googleButtonRef} />
          </div>
        </div>

        <p className="text-center text-sm text-dark-muted mt-6">
          Already have an account? <Link href="/login" className="text-primary-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
