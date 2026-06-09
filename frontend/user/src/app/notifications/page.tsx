'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bell, Check } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface NotificationRow {
  id: string;
  title: string;
  message?: string;
  body?: string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationsPage() {
  const [selectedNotification, setSelectedNotification] = useState<NotificationRow | null>(null);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<NotificationRow[]>({
    queryKey: ['notifications'],
    queryFn: async () => { const { data } = await api.get('/notifications/'); return data?.results || data || []; },
    refetchInterval: 15_000,
  });

  const markReadMut = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/notifications/${id}/read/`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const rows = data || [];

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'message',
      label: 'Message',
      sortable: false,
      render: (row: NotificationRow) => row.message || row.body || 'N/A',
    },
    {
      key: 'is_read',
      label: 'Read',
      render: (row: NotificationRow) => row.is_read ? 'Yes' : 'No',
      sortValue: (row: NotificationRow) => (row.is_read ? 1 : 0),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: NotificationRow) => new Date(row.created_at).toLocaleString(),
      sortValue: (row: NotificationRow) => new Date(row.created_at).getTime(),
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Notifications"
        subtitle="Platform alerts and activity updates"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Notifications' }]}
      >
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-16" />)}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-dark-muted">
            <Bell size={48} className="mx-auto mb-3 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Search notifications..."
            onRowClick={(row) => setSelectedNotification(row)}
            getRowActions={(row) => row.is_read ? [] : [
              {
                label: 'Mark as Read',
                onClick: () => markReadMut.mutate(row.id),
                icon: <Check size={14} />,
                disabled: markReadMut.isPending,
              },
            ]}
          />
        )}
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedNotification)}
        title="Notification Details"
        onClose={() => setSelectedNotification(null)}
        rows={selectedNotification ? [
          { label: 'Title', value: selectedNotification.title },
          { label: 'Message', value: selectedNotification.message || selectedNotification.body || 'N/A' },
          { label: 'Read', value: selectedNotification.is_read ? 'Yes' : 'No' },
          { label: 'Created At', value: new Date(selectedNotification.created_at).toLocaleString() },
        ] : []}
      />
    </DashboardLayout>
  );
}
