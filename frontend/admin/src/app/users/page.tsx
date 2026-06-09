'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { CheckCircle, XCircle } from 'lucide-react';
import { TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface UserRow {
  id: string;
  phone: string;
  full_name: string | null;
  kyc_status: string | null;
}

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users/').then((r) => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/approve/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/reject/`),
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
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="User Management"
        subtitle="View and manage user accounts and KYC"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/dashboard' }, { label: 'Users' }]}
      >
        <DataTable
          columns={columns}
          loading={isLoading}
          data={users}
          searchPlaceholder="Search by phone, name, or status..."
          onRowClick={(row) => setSelectedUser(row)}
          getRowActions={(row) => {
            if (row.kyc_status !== 'PENDING') {
              return [];
            }

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
            ];
          }}
        />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedUser)}
        title="User Details"
        onClose={() => setSelectedUser(null)}
        rows={selectedUser ? [
          { label: 'ID', value: selectedUser.id },
          { label: 'Phone', value: selectedUser.phone },
          { label: 'Full Name', value: selectedUser.full_name || 'N/A' },
          { label: 'KYC Status', value: selectedUser.kyc_status || 'N/A' },
        ] : []}
      />
    </DashboardLayout>
  );
}

