'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';

interface ReferralRow {
  code: string;
  referred_id: string;
  status: string;
  points_credited: number;
}

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'riders'>('users');

  const { data: userRefs = [], isLoading: loadingUsers } = useQuery<ReferralRow[]>({
    queryKey: ['admin-referrals-users'],
    queryFn: () => api.get('/admin-panel/referrals/users/').then((r) => r.data),
    enabled: activeTab === 'users',
  });

  const { data: riderRefs = [], isLoading: loadingRiders } = useQuery<ReferralRow[]>({
    queryKey: ['admin-referrals-riders'],
    queryFn: () => api.get('/admin-panel/referrals/riders/').then((r) => r.data),
    enabled: activeTab === 'riders',
  });

  const columns = [
    { key: 'code', label: 'Referral Code' },
    { key: 'referred_id', label: 'Referred ID', render: (r: ReferralRow) => r.referred_id.slice(0, 8) + '...' },
    { key: 'status', label: 'Status', render: (r: ReferralRow) => <StatusBadge status={r.status} /> },
    { key: 'points_credited', label: 'Points', render: (r: ReferralRow) => r.points_credited || 0 },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Referrals</h1>
          <p className="text-dark-muted text-sm mt-1">User and rider referral tracking</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['users', 'riders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-dark-surface text-dark-muted hover:text-white border border-dark-border'
              }`}
            >
              {tab === 'users' ? 'User Referrals' : 'Rider Referrals'}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <DataTable columns={columns} data={userRefs} page={1} totalPages={1} onPageChange={() => {}} isLoading={loadingUsers} />
        )}
        {activeTab === 'riders' && (
          <DataTable columns={columns} data={riderRefs} page={1} totalPages={1} onPageChange={() => {}} isLoading={loadingRiders} />
        )}
      </main>
    </div>
  );
}
