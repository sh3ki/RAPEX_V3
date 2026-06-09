'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { CheckCircle, XCircle, Wallet, Gift } from 'lucide-react';
import { TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface RiderRow {
  id: string;
  full_name: string;
  vehicle_type: string;
  kyc_status: string;
  is_online: boolean;
}

export default function RidersPage() {
  const [selectedRider, setSelectedRider] = useState<RiderRow | null>(null);
  const [walletModal, setWalletModal] = useState<string | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: riders = [], isLoading } = useQuery<RiderRow[]>({
    queryKey: ['admin-riders'],
    queryFn: () => api.get('/admin/riders/').then((r) => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/riders/${id}/approve/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-riders'] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/riders/${id}/reject/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-riders'] }),
  });

  const walletLoadMut = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      api.post(`/admin/riders/${id}/wallet/load/`, { amount }),
    onSuccess: () => {
      setWalletModal(null);
      setWalletAmount('');
      queryClient.invalidateQueries({ queryKey: ['admin-riders'] });
    },
  });

  const incentiveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/riders/${id}/incentive/confirm/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-riders'] }),
  });

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'vehicle_type', label: 'Vehicle' },
    {
      key: 'kyc_status',
      label: 'KYC',
      render: (r: RiderRow) => <StatusBadge status={r.kyc_status} />,
    },
    {
      key: 'is_online',
      label: 'Status',
      render: (r: RiderRow) => <StatusBadge status={r.is_online ? 'Online' : 'Offline'} />,
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Rider Management"
        subtitle="Manage rider accounts, KYC, wallet, and incentives"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/dashboard' }, { label: 'Riders' }]}
      >
        <DataTable
          loading={isLoading}
          columns={columns}
          data={riders}
          searchPlaceholder="Search by rider, vehicle, or status..."
          onRowClick={(row) => setSelectedRider(row)}
          getRowActions={(row) => {
            const actions = [
              {
                label: 'Load Wallet',
                onClick: () => setWalletModal(row.id),
                icon: <Wallet size={14} />,
              },
              {
                label: 'Confirm Incentive',
                onClick: () => incentiveMut.mutate(row.id),
                icon: <Gift size={14} />,
                disabled: incentiveMut.isPending,
              },
            ];

            if (row.kyc_status === 'PENDING') {
              return [
                {
                  label: 'Approve KYC',
                  onClick: () => approveMut.mutate(row.id),
                  icon: <CheckCircle size={14} />,
                  disabled: approveMut.isPending,
                },
                {
                  label: 'Reject KYC',
                  onClick: () => rejectMut.mutate(row.id),
                  icon: <XCircle size={14} />,
                  disabled: rejectMut.isPending,
                },
                ...actions,
              ];
            }

            return actions;
          }}
        />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedRider)}
        title="Rider Details"
        onClose={() => setSelectedRider(null)}
        rows={selectedRider ? [
          { label: 'ID', value: selectedRider.id },
          { label: 'Name', value: selectedRider.full_name },
          { label: 'Vehicle', value: selectedRider.vehicle_type },
          { label: 'KYC Status', value: selectedRider.kyc_status },
          { label: 'Online', value: selectedRider.is_online ? 'Yes' : 'No' },
        ] : []}
      />

        {/* Wallet Load Modal */}
        {walletModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Load Rider Wallet</h3>
              <input
                type="number"
                className="input mb-4"
                placeholder="Amount (₱)"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1"
                  onClick={() => walletLoadMut.mutate({ id: walletModal, amount: walletAmount })}
                  disabled={!walletAmount || walletLoadMut.isPending}
                >
                  {walletLoadMut.isPending ? 'Loading...' : 'Load Wallet'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setWalletModal(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}

