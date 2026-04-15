'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { User, Phone, Shield } from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Profile and account settings</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Profile Info */}
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User size={20} className="text-primary" /> Profile
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Phone</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Phone size={14} /> {user?.phone || '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Name</p>
                <p className="text-gray-900 font-medium">{user?.first_name} {user?.last_name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Role</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Shield size={14} className="text-primary" /> {user?.role || 'MERCHANT'}
                </p>
              </div>
            </div>
          </div>

          {/* KYC Info */}
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">KYC Verification</h2>
            <p className="text-gray-500 text-sm">
              Your KYC verification status determines your ability to create stores and accept orders.
              Contact support if you need to update your KYC documents.
            </p>
          </div>

          {/* App Info */}
          <div className="card space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">About</h2>
            <p className="text-gray-500 text-sm">RAPEX Merchant Portal v1.0.0</p>
            <p className="text-gray-500 text-sm">Build: Phase 11 - Next.js Frontend</p>
          </div>
        </div>
    </DashboardLayout>
  );
}
