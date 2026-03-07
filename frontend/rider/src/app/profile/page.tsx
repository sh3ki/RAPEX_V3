'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { User, Phone, Shield, LogOut, Bike, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { logout } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const { data } = await api.get('/auth/user/profile/'); return data; },
  });

  const kycStatus = profile?.kyc_status || 'NOT_SUBMITTED';
  const kycColor: Record<string, string> = { APPROVED: 'badge-green', PENDING: 'badge-yellow', REJECTED: 'badge-red', NOT_SUBMITTED: 'badge-blue' };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>

      {/* Rider info */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-500/10 flex items-center justify-center">
          <User size={28} className="text-primary-500" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold">{profile?.first_name} {profile?.last_name}</h2>
          <div className="flex items-center gap-2 text-xs text-dark-muted mt-0.5"><Phone size={10} /> {profile?.phone}</div>
          <div className="flex items-center gap-2 text-xs text-dark-muted"><Bike size={10} /> Rider</div>
        </div>
      </div>

      {/* KYC */}
      <div className="card !p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2"><Shield size={14} /> KYC Status</h2>
          <span className={kycColor[kycStatus] || 'badge-blue'}>{kycStatus.replace('_', ' ')}</span>
        </div>
        {kycStatus === 'APPROVED' ? (
          <p className="text-xs text-green-400 mt-2">You are verified and can accept deliveries.</p>
        ) : kycStatus === 'PENDING' ? (
          <p className="text-xs text-dark-muted mt-2">Your KYC documents are under review.</p>
        ) : (
          <p className="text-xs text-dark-muted mt-2">Please upload your ID and vehicle documents to start delivering.</p>
        )}
      </div>

      {/* Menu */}
      <div className="card !p-0 divide-y divide-dark-border">
        <Link href="/wallet" className="flex items-center justify-between px-4 py-3 hover:bg-dark-border/30 transition-colors">
          <span className="text-sm">Wallet & Earnings</span><ChevronRight size={16} className="text-dark-muted" />
        </Link>
        <Link href="/orders" className="flex items-center justify-between px-4 py-3 hover:bg-dark-border/30 transition-colors">
          <span className="text-sm">Delivery History</span><ChevronRight size={16} className="text-dark-muted" />
        </Link>
      </div>

      {/* Logout */}
      <button onClick={() => { if (confirm('Sign out?')) logout(); }} className="w-full py-3 rounded-lg border border-red-500/30 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
