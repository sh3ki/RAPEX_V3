'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface ReferralRow {
  code: string;
  referred_id: string;
  status: string;
  points_credited: number;
}

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'riders'>('users');
  const [selectedRow, setSelectedRow] = useState<ReferralRow | null>(null);

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

  const tableData = activeTab === 'users' ? userRefs : riderRefs;
  const loading = activeTab === 'users' ? loadingUsers : loadingRiders;

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Referrals"
        subtitle="User and rider referral tracking"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/dashboard' }, { label: 'Referrals' }]}
      >
        <DataTable
          columns={columns}
          data={tableData}
          loading={loading}
          onRowClick={(row) => setSelectedRow(row)}
          tabs={[
            { value: 'users', label: 'User Referrals', count: userRefs.length },
            { value: 'riders', label: 'Rider Referrals', count: riderRefs.length },
          ]}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as 'users' | 'riders')}
          filterByTab={() => true}
        />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedRow)}
        title="Referral Details"
        onClose={() => setSelectedRow(null)}
        rows={selectedRow ? [
          { label: 'Referral Code', value: selectedRow.code },
          { label: 'Referred ID', value: selectedRow.referred_id },
          { label: 'Status', value: selectedRow.status },
          { label: 'Points', value: String(selectedRow.points_credited || 0) },
          { label: 'Type', value: activeTab === 'users' ? 'User Referral' : 'Rider Referral' },
        ] : []}
      />
    </DashboardLayout>
  );
}

