'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Search, CheckCircle, XCircle } from 'lucide-react';

interface UserRow {
  id: string;
  phone: string;
  full_name: string | null;
  kyc_status: string | null;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users', search],
    queryFn: () => api.get('/admin-panel/users/', { params: search ? { search } : {} }).then((r) => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin-panel/users/${id}/approve/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin-panel/users/${id}/reject/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const columns = [
    { key: 'phone', label: 'Phone' },
    { key: 'full_name', label: 'Full Name', render: (r: UserRow) => r.full_name || '—' },
    {
      key: 'kyc_status',
      label: 'KYC Status',
      render: (r: UserRow) => r.kyc_status ? <StatusBadge status={r.kyc_status} /> : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: UserRow) => (
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
    <DashboardLayout>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">View and manage user accounts & KYC</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by phone or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DataTable
          columns={columns}
          data={users}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          isLoading={isLoading}
        />
    </DashboardLayout>
  );
}
