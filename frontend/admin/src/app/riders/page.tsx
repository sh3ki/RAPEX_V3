'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Search, CheckCircle, XCircle, Wallet, Gift } from 'lucide-react';

interface RiderRow {
  id: string;
  full_name: string;
  vehicle_type: string;
  kyc_status: string;
  is_online: boolean;
}

export default function RidersPage() {
  const [search, setSearch] = useState('');
  const [walletModal, setWalletModal] = useState<string | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: riders = [], isLoading } = useQuery<RiderRow[]>({
    queryKey: ['admin-riders', search],
    queryFn: () => api.get('/admin-panel/riders/', { params: search ? { search } : {} }).then((r) => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin-panel/riders/${id}/approve/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-riders'] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin-panel/riders/${id}/reject/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-riders'] }),
  });

  const walletLoadMut = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      api.post(`/admin-panel/riders/${id}/wallet/load/`, { amount }),
    onSuccess: () => {
      setWalletModal(null);
      setWalletAmount('');
      queryClient.invalidateQueries({ queryKey: ['admin-riders'] });
    },
  });

  const incentiveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin-panel/riders/${id}/incentive/confirm/`),
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
    {
      key: 'actions',
      label: 'Actions',
      render: (r: RiderRow) => (
        <div className="flex gap-2 flex-wrap">
          {r.kyc_status === 'PENDING' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); approveMut.mutate(r.id); }}
                className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs"
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); rejectMut.mutate(r.id); }}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs"
              >
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setWalletModal(r.id); }}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
          >
            <Wallet size={14} /> Load
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); incentiveMut.mutate(r.id); }}
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs"
          >
            <Gift size={14} /> Incentive
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Rider Management</h1>
          <p className="text-dark-muted text-sm mt-1">Manage rider accounts, KYC, wallet, and incentives</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DataTable
          columns={columns}
          data={riders}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          isLoading={isLoading}
        />

        {/* Wallet Load Modal */}
        {walletModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Load Rider Wallet</h3>
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
      </main>
    </div>
  );
}
