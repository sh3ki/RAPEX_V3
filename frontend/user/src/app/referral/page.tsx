'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Gift, Copy, Users, Check } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface ReferralEntry {
  name?: string;
  phone?: string;
  created_at?: string;
  status?: string;
}

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralEntry | null>(null);

  const { data } = useQuery({
    queryKey: ['referral'],
    queryFn: async () => { const { data } = await api.get('/user/referral/'); return data; },
  });

  const code = data?.referral_code || data?.code || '---';
  const total = data?.total_referrals || data?.count || 0;
  const earned = data?.total_earned || data?.earnings || 0;
  const referralRows: ReferralEntry[] = (data?.referrals || []) as ReferralEntry[];

  const referralColumns = [
    {
      key: 'name',
      label: 'Referral',
      render: (row: ReferralEntry) => row.name || row.phone || 'User',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: ReferralEntry) => row.status || 'Joined',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: ReferralEntry) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A',
      sortValue: (row: ReferralEntry) => row.created_at ? new Date(row.created_at).getTime() : 0,
    },
  ];

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Refer and Earn"
        subtitle="Share your code and track referral progress"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Referral' }]}
      >

      {/* Info card */}
      <div className="card text-center space-y-3 bg-gradient-to-br from-primary-500/10 to-transparent border-primary-500/20">
        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto">
          <Gift size={32} className="text-primary-500" />
        </div>
        <h2 className="font-bold text-lg">Share your code & earn rewards!</h2>
        <p className="text-sm text-dark-muted">When friends sign up with your code and place their first order, you both earn loyalty points.</p>
      </div>

      {/* Code */}
      <div className="card !p-4">
        <p className="text-xs text-dark-muted mb-2">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-center">
            <span className="text-2xl font-bold tracking-widest text-primary-500">{code}</span>
          </div>
          <button onClick={copyCode} className="p-3 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors">
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <Users size={20} className="text-blue-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{total}</p>
          <p className="text-xs text-dark-muted">Referrals</p>
        </div>
        <div className="card text-center">
          <Gift size={20} className="text-green-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{earned}</p>
          <p className="text-xs text-dark-muted">Points Earned</p>
        </div>
      </div>

      {/* Referral list */}
      {referralRows.length > 0 && (
        <>
          <h2 className="font-semibold text-sm text-dark-muted">Your Referrals</h2>
          <DataTable
            columns={referralColumns}
            data={referralRows}
            onRowClick={(row) => setSelectedReferral(row)}
            searchPlaceholder="Search referral entries..."
          />
        </>
      )}
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedReferral)}
        title="Referral Details"
        onClose={() => setSelectedReferral(null)}
        rows={selectedReferral ? [
          { label: 'Name', value: selectedReferral.name || 'N/A' },
          { label: 'Phone', value: selectedReferral.phone || 'N/A' },
          { label: 'Status', value: selectedReferral.status || 'Joined' },
          { label: 'Created At', value: selectedReferral.created_at ? new Date(selectedReferral.created_at).toLocaleString() : 'N/A' },
        ] : []}
      />
    </DashboardLayout>
  );
}
