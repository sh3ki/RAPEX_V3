'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { authText } from '@shared/localization/auth';

const t = authText('en');

export default function RegisterPage() {
  const requestMagicLink = useAuthStore((s) => s.requestMagicLink);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      const result = await requestMagicLink(email, 'MERCHANT', `${window.location.origin}/login`);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant Signup</h1>
          <p className="text-gray-500 text-sm mt-1">Email-only signup. We send a secure magic link.</p>
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
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have access? <Link href="/login" className="text-primary-500 hover:underline">Go to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
