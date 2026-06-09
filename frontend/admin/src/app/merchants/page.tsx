'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { CheckCircle, Plus, X, XCircle } from 'lucide-react';
import { TablePageLayout } from '@shared/components/table';

interface MerchantRow {
  id: string;
  business_name: string;
  phone: string;
  kyc_status: string;
  profile_image_url?: string;
  merchant_name?: string;
  merchant_username?: string;
  merchant_email?: string;
  merchant_phone?: string;
  registration_type?: string;
  registration_type_label?: string;
  business_categories?: string[];
  business_types?: string[];
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

type StatusTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface RejectModalState {
  open: boolean;
  merchantId: string;
  businessName: string;
  note: string;
}

export default function MerchantsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [showAddMerchant, setShowAddMerchant] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteInfo, setInviteInfo] = useState('');
  const [rejectModal, setRejectModal] = useState<RejectModalState>({
    open: false,
    merchantId: '',
    businessName: '',
    note: '',
  });
  const [rejectError, setRejectError] = useState('');
  const queryClient = useQueryClient();

  const { data: merchants = [], isLoading } = useQuery<MerchantRow[]>({
    queryKey: ['admin-merchants'],
    queryFn: () => api.get('/admin/merchants/').then((r) => r.data),
    staleTime: 0,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/merchants/${id}/approve/`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-merchant-details', id] });
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.patch(`/admin/merchants/${id}/reject/`, { note }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-merchant-details', variables.id] });
      setRejectModal({ open: false, merchantId: '', businessName: '', note: '' });
      setRejectError('');
    },
    onError: (error: any) => {
      setRejectError(error?.response?.data?.message || 'Failed to reject merchant KYC.');
    },
  });

  const inviteMut = useMutation({
    mutationFn: (email: string) => {
      const merchantAppOrigin = process.env.NEXT_PUBLIC_MERCHANT_APP_URL || 'http://localhost:3002';
      return api.post('/auth/magic-link/request/', {
        email,
        role: 'MERCHANT',
        redirect_url: `${merchantAppOrigin}/auth/callback`,
      });
    },
    onSuccess: (response: any) => {
      const debugLink = response?.debug_magic_link;
      setInviteInfo(debugLink ? `Magic link sent. Dev link: ${debugLink}` : 'Magic link sent to merchant email.');
      setInviteError('');
      setInviteEmail('');
    },
    onError: (error: any) => {
      setInviteInfo('');
      setInviteError(error?.response?.data?.message || 'Failed to send magic link.');
    },
  });

  const actionBusy = approveMut.isPending || rejectMut.isPending;

  const columns = [
    {
      key: 'profile_image_url',
      label: 'Store Profile',
      sortable: false,
      render: (r: MerchantRow) => {
        const imageUrl = String(r.profile_image_url || '').trim();
        const initial = (r.business_name || 'M').trim().charAt(0).toUpperCase() || 'M';
        const phoneValue = r.merchant_phone || r.phone || 'N/A';

        return (
          <div className="flex min-w-[240px] items-start gap-2.5">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${r.business_name || 'Merchant'} profile`}
                className="h-10 w-10 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-primary-50 text-xs font-semibold text-primary-700">
                {initial}
              </div>
            )}

            <div className="min-w-0 text-xs text-gray-600">
              <p className="truncate text-sm font-semibold text-gray-900">{r.merchant_name || 'N/A'}</p>
              <p className="truncate">@{r.merchant_username || 'N/A'}</p>
              <p className="truncate">{r.merchant_email || 'N/A'}</p>
              <p className="truncate">{phoneValue}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'business_name',
      label: 'Business',
      render: (r: MerchantRow) => (
        <div className="min-w-[280px] text-xs text-gray-600">
          <p className="truncate text-sm font-semibold text-gray-900">{r.business_name || 'N/A'}</p>
          <p className="truncate">Registration: {r.registration_type_label || r.registration_type || 'N/A'}</p>
          <p className="truncate">Category: {r.business_categories?.length ? r.business_categories.join(', ') : 'N/A'}</p>
          <p className="truncate">Business Type: {r.business_types?.length ? r.business_types.join(', ') : 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'kyc_status',
      label: 'KYC Status',
      render: (r: MerchantRow) => <StatusBadge status={r.kyc_status} />,
    },
    {
      key: 'onboarding',
      label: 'Onboarding',
      sortable: false,
      render: (r: MerchantRow) => (
        <div className="w-[160px]">
          <p className="text-[11px] text-gray-500">Progress</p>
          <div className="mt-1 h-2 rounded-full bg-gray-700/40">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all"
              style={{ width: `${r.onboarding_progress?.percentage || 0}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {r.onboarding_progress?.completed_steps || 0}/{r.onboarding_progress?.total_steps || 5}
          </p>
        </div>
      ),
    },
  ];

  const tabCounts = {
    ALL: merchants.length,
    PENDING: merchants.filter((merchant) => merchant.kyc_status === 'PENDING').length,
    APPROVED: merchants.filter((merchant) => merchant.kyc_status === 'APPROVED').length,
    REJECTED: merchants.filter((merchant) => merchant.kyc_status === 'REJECTED').length,
  };

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Merchant Management"
        subtitle="View merchants and manage KYC approvals"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/dashboard' }, { label: 'Merchants' }]}
        actionSlot={(
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => {
              setShowAddMerchant(true);
              setInviteError('');
              setInviteInfo('');
            }}
          >
            <Plus size={16} /> Add Merchant
          </button>
        )}
      >
        <DataTable
          columns={columns}
          loading={isLoading}
          data={merchants}
          searchPlaceholder="Search by business name, phone, or status..."
          tabs={[
            { value: 'ALL', label: 'All Merchants', count: tabCounts.ALL },
            { value: 'PENDING', label: 'Pending KYC', count: tabCounts.PENDING },
            { value: 'APPROVED', label: 'Approved', count: tabCounts.APPROVED },
            { value: 'REJECTED', label: 'Rejected', count: tabCounts.REJECTED },
          ]}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as StatusTab)}
          filterByTab={(row, tab) => tab === 'ALL' || row.kyc_status === tab}
          onRowClick={(row) => router.push(`/merchants/${row.id}`)}
          getRowActions={(row) => {
            if (row.kyc_status !== 'PENDING') {
              return [];
            }

            return [
              {
                label: 'Approve KYC',
                onClick: () => approveMut.mutate(row.id),
                icon: <CheckCircle size={14} />,
                disabled: actionBusy || !row.onboarding_progress?.can_review,
              },
              {
                label: 'Reject KYC',
                onClick: () => {
                  setRejectError('');
                  setRejectModal({
                    open: true,
                    merchantId: row.id,
                    businessName: row.business_name,
                    note: '',
                  });
                },
                icon: <XCircle size={14} />,
                disabled: actionBusy || !row.onboarding_progress?.can_review,
              },
            ];
          }}
        />
      </TablePageLayout>

      {showAddMerchant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Merchant</h2>
                <p className="mt-1 text-sm text-gray-500">Send signup magic link to merchant email.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMerchant(false)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="space-y-4 px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!inviteEmail.trim()) {
                  setInviteError('Email is required.');
                  return;
                }
                setInviteError('');
                setInviteInfo('');
                inviteMut.mutate(inviteEmail.trim().toLowerCase());
              }}
            >
              {inviteError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{inviteError}</div>
              ) : null}
              {inviteInfo ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{inviteInfo}</div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Merchant Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="merchant@example.com"
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMerchant(false)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMut.isPending}
                  className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={14} /> {inviteMut.isPending ? 'Sending...' : 'Send Magic Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {rejectModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reject Merchant KYC</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add a note for {rejectModal.businessName || 'this merchant'} so they know what to fix before resubmission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectModal({ open: false, merchantId: '', businessName: '', note: '' });
                  setRejectError('');
                }}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              {rejectError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{rejectError}</div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Rejection Note</label>
                <textarea
                  value={rejectModal.note}
                  onChange={(event) => setRejectModal((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Example: Please upload a clearer Valid ID front image and ensure business permit is not expired."
                  className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModal({ open: false, merchantId: '', businessName: '', note: '' });
                    setRejectError('');
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const note = rejectModal.note.trim();
                    if (!note) {
                      setRejectError('Rejection note is required.');
                      return;
                    }
                    setRejectError('');
                    rejectMut.mutate({ id: rejectModal.merchantId, note });
                  }}
                  disabled={rejectMut.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={14} /> {rejectMut.isPending ? 'Rejecting...' : 'Reject KYC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

