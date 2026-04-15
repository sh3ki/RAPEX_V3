'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
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
    queryFn: () => api.get('/admin/referrals/users/').then((r) => r.data),
    enabled: activeTab === 'users',
  });

  const { data: riderRefs = [], isLoading: loadingRiders } = useQuery<ReferralRow[]>({
    queryKey: ['admin-referrals-riders'],
    queryFn: () => api.get('/admin/referrals/riders/').then((r) => r.data),
    enabled: activeTab === 'riders',
  });

  const columns = [
    { key: 'code', label: 'Referral Code' },
    { key: 'referred_id', label: 'Referred ID', render: (r: ReferralRow) => r.referred_id.slice(0, 8) + '...' },
    { key: 'status', label: 'Status', render: (r: ReferralRow) => <StatusBadge status={r.status} /> },
    { key: 'points_credited', label: 'Points', render: (r: ReferralRow) => r.points_credited || 0 },
  ];

  return (
    <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="text-gray-500 text-sm mt-1">User and rider referral tracking</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['users', 'riders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {tab === 'users' ? 'User Referrals' : 'Rider Referrals'}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <DataTable columns={columns} data={userRefs} />
        )}
        {activeTab === 'riders' && (
          <DataTable columns={columns} data={riderRefs} />
        )}
    </DashboardLayout>
  );
}

