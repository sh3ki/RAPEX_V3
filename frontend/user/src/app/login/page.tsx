'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await login(email, password); router.push('/'); }
    catch { setError('Invalid email or password'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-500 mb-1">RAPEX</h1>
          <p className="text-dark-muted text-sm">Order anything, delivered fast</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm">{error}</div>}
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Email Address</label>
            <input className="input" type="email" placeholder="user@rapex.ph" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p className="text-center text-sm text-dark-muted mt-6">
          Don&apos;t have an account? <Link href="/register" className="text-primary-500 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
