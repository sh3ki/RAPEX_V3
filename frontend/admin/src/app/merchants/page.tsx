'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Search, CheckCircle, XCircle } from 'lucide-react';

interface MerchantRow {
  id: string;
  business_name: string;
  phone: string;
  kyc_status: string;
}

export default function MerchantsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: merchants = [], isLoading } = useQuery<MerchantRow[]>({
    queryKey: ['admin-merchants', search],
    queryFn: () => api.get('/admin-panel/merchants/', { params: search ? { search } : {} }).then((r) => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin-panel/merchants/${id}/approve/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-merchants'] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin-panel/merchants/${id}/reject/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-merchants'] }),
  });

  const columns = [
    { key: 'business_name', label: 'Business Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'kyc_status',
      label: 'KYC Status',
      render: (r: MerchantRow) => <StatusBadge status={r.kyc_status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: MerchantRow) => (
        <div className="flex gap-2">
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
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Merchant Management</h1>
          <p className="text-dark-muted text-sm mt-1">View merchants and manage KYC approvals</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by business name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DataTable
          columns={columns}
          data={merchants}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
