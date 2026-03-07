'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', password: '', referral_code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await api.post('/auth/otp/request/', { phone }); setStep('otp'); }
    catch { setError('Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await api.post('/auth/otp/verify/', { phone, otp }); setStep('details'); }
    catch { setError('Invalid OTP'); }
    finally { setLoading(false); }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.post('/auth/register/user/', { phone, ...form });
      router.push('/login');
    } catch { setError('Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-500 mb-1">RAPEX</h1>
          <p className="text-dark-muted text-sm">Create your account</p>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}

        {step === 'phone' && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div><label className="text-xs text-dark-muted mb-1 block">Phone Number</label>
              <input className="input" placeholder="08012345678" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending OTP…' : 'Send OTP'}</button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-dark-muted">Enter the 6-digit code sent to {phone}</p>
            <input className="input text-center text-2xl tracking-[0.5em]" maxLength={6} placeholder="------" value={otp} onChange={e => setOtp(e.target.value)} required />
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Verifying…' : 'Verify OTP'}</button>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={register} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-dark-muted mb-1 block">First Name</label>
                <input className="input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
              </div>
              <div><label className="text-xs text-dark-muted mb-1 block">Last Name</label>
                <input className="input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
              </div>
            </div>
            <div><label className="text-xs text-dark-muted mb-1 block">Password</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div><label className="text-xs text-dark-muted mb-1 block">Referral Code (optional)</label>
              <input className="input" value={form.referral_code} onChange={e => setForm(f => ({ ...f, referral_code: e.target.value }))} />
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
          </form>
        )}

        <p className="text-center text-sm text-dark-muted mt-6">
          Already have an account? <Link href="/login" className="text-primary-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
