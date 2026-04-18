'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Search, CheckCircle, XCircle } from 'lucide-react';

interface MerchantRow {
  id: string;
  business_name: string;
  phone: string;
  kyc_status: string;
  onboarding_progress: {
    completed_steps: number;
    total_steps: number;
    percentage: number;
    can_review: boolean;
    checklist: Array<{
      key: string;
      label: string;
      completed: boolean;
    }>;
  };
}

export default function MerchantsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: merchants = [], isLoading } = useQuery<MerchantRow[]>({
    queryKey: ['admin-merchants', search],
    queryFn: () => api.get('/admin/merchants/', { params: search ? { search } : {} }).then((r) => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/merchants/${id}/approve/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-merchants'] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/merchants/${id}/reject/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-merchants'] }),
  });

  const actionBusy = approveMut.isPending || rejectMut.isPending;

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
        <div className="flex flex-col gap-2">
          <div className="w-[160px]">
            <p className="text-[11px] text-gray-500">Onboarding Progress</p>
            <div className="mt-1 h-2 rounded-full bg-gray-700/40">
              <div
                className="h-2 rounded-full bg-primary-500 transition-all"
                style={{ width: `${r.onboarding_progress?.percentage || 0}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {r.onboarding_progress?.completed_steps || 0}/{r.onboarding_progress?.total_steps || 5} steps complete
            </p>
          </div>

          {r.kyc_status === 'PENDING' && (
            <>
              <button
                disabled={actionBusy || !r.onboarding_progress?.can_review}
                title={r.onboarding_progress?.can_review ? 'Approve merchant KYC' : 'Complete all onboarding steps first'}
                onClick={(e) => { e.stopPropagation(); approveMut.mutate(r.id); }}
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                disabled={actionBusy || !r.onboarding_progress?.can_review}
                title={r.onboarding_progress?.can_review ? 'Reject merchant KYC' : 'Complete all onboarding steps first'}
                onClick={(e) => { e.stopPropagation(); rejectMut.mutate(r.id); }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={14} /> Reject
              </button>
              {!r.onboarding_progress?.can_review ? (
                <p className="text-[11px] text-amber-300">Pending onboarding completion</p>
              ) : null}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Merchant Management</h1>
          <p className="text-gray-500 text-sm mt-1">View merchants and manage KYC approvals</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
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
        />
    </DashboardLayout>
  );
}

