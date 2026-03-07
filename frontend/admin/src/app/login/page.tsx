'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">
            R
          </div>
          <div>
            <span className="text-2xl font-bold text-white">RAPEX</span>
            <span className="block text-sm text-dark-muted">Admin Portal</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <h2 className="text-lg font-semibold text-white text-center">Sign In</h2>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div>
            <label className="block text-sm text-dark-muted mb-1">Phone Number</label>
            <input
              type="text"
              className="input"
              placeholder="09XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
