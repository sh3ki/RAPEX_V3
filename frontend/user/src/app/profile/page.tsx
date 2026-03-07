'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { User, Phone, Mail, Shield, LogOut, ChevronRight, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const { logout } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const { data } = await api.get('/auth/user/profile/'); return data; },
  });

  const uploadKyc = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      await api.post('/auth/kyc/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch {}
    setUploading(false);
  };

  const kycStatus = profile?.kyc_status || 'NOT_SUBMITTED';
  const kycColor: Record<string, string> = { APPROVED: 'badge-green', PENDING: 'badge-yellow', REJECTED: 'badge-red', NOT_SUBMITTED: 'badge-blue' };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>

      {/* User info */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-500/10 flex items-center justify-center">
          <User size={28} className="text-primary-500" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold">{profile?.first_name} {profile?.last_name}</h2>
          <div className="flex items-center gap-2 text-xs text-dark-muted mt-0.5">
            <Phone size={10} /> {profile?.phone}
          </div>
          {profile?.email && (
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Mail size={10} /> {profile.email}
            </div>
          )}
        </div>
      </div>

      {/* KYC */}
      <div className="card !p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2"><Shield size={14} /> KYC Verification</h2>
          <span className={kycColor[kycStatus] || 'badge-blue'}>{kycStatus.replace('_', ' ')}</span>
        </div>
        {kycStatus === 'NOT_SUBMITTED' || kycStatus === 'REJECTED' ? (
          <>
            <p className="text-xs text-dark-muted">Upload a valid ID to verify your account.</p>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadKyc(e.target.files[0]); }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary text-sm flex items-center gap-2">
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload KYC Document'}
            </button>
          </>
        ) : kycStatus === 'PENDING' ? (
          <p className="text-xs text-dark-muted">Your document is under review. We&apos;ll notify you once verified.</p>
        ) : (
          <p className="text-xs text-green-400">Your account is verified!</p>
        )}
      </div>

      {/* Menu items */}
      <div className="card !p-0 divide-y divide-dark-border">
        <Link href="/wallet" className="flex items-center justify-between px-4 py-3 hover:bg-dark-border/30 transition-colors">
          <span className="text-sm">Wallet & Points</span><ChevronRight size={16} className="text-dark-muted" />
        </Link>
        <Link href="/referral" className="flex items-center justify-between px-4 py-3 hover:bg-dark-border/30 transition-colors">
          <span className="text-sm">Referral Program</span><ChevronRight size={16} className="text-dark-muted" />
        </Link>
        <Link href="/orders" className="flex items-center justify-between px-4 py-3 hover:bg-dark-border/30 transition-colors">
          <span className="text-sm">Order History</span><ChevronRight size={16} className="text-dark-muted" />
        </Link>
      </div>

      {/* Logout */}
      <button onClick={() => { if (confirm('Sign out?')) logout(); }} className="w-full py-3 rounded-lg border border-red-500/30 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
