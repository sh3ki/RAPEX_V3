'use client';

import { useState, type ChangeEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Send, Bell } from 'lucide-react';
import type { TableColumn } from '@shared/components/table';
import { TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface NotifRow {
  id: string;
  event_type: string;
  recipient_role: string;
  delivery_status: string;
  created_at: string;
}

interface BroadcastResponse {
  sent_to: number;
}

export default function NotificationsPage() {
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotifRow | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [roles, setRoles] = useState<string[]>(['USER', 'MERCHANT', 'RIDER']);

  const { data: logs = [], isLoading } = useQuery<NotifRow[]>({
    queryKey: ['admin-notification-log'],
    queryFn: async () => {
      const response = await api.get<NotifRow[]>('/admin/notifications/log/');
      return response.data;
    },
  });

  const broadcastMut = useMutation<BroadcastResponse>({
    mutationFn: async () => {
      const response = await api.post<BroadcastResponse>('/admin/notifications/broadcast/', { title, body, roles });
      return response.data;
    },
    onSuccess: (responseData) => {
      alert(`Broadcast sent to ${responseData.sent_to} users`);
      setShowBroadcast(false);
      setTitle('');
      setBody('');
    },
  });

  const toggleRole = (role: string) => {
    setRoles((previousRoles) => {
      return previousRoles.includes(role)
        ? previousRoles.filter((existingRole) => existingRole !== role)
        : [...previousRoles, role];
    });
  };

  const columns: TableColumn<NotifRow>[] = [
    { key: 'event_type', label: 'Event' },
    { key: 'recipient_role', label: 'Role' },
    {
      key: 'delivery_status',
      label: 'Delivery',
      render: (r: NotifRow) => <StatusBadge status={r.delivery_status} />,
    },
    {
      key: 'created_at',
      label: 'Time',
      render: (r: NotifRow) => new Date(r.created_at).toLocaleString(),
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Notifications"
        subtitle="Notification log and broadcast messaging"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/dashboard' }, { label: 'Notifications' }]}
        actionSlot={
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowBroadcast(true)}>
            <Send size={16} /> Broadcast
          </button>
        }
      >
        <DataTable
          loading={isLoading}
          columns={columns}
          data={logs}
          selectable={false}
          onRowClick={(row) => setSelectedLog(row)}
        />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedLog)}
        title="Notification Log Details"
        onClose={() => setSelectedLog(null)}
        rows={selectedLog ? [
          { label: 'ID', value: selectedLog.id },
          { label: 'Event Type', value: selectedLog.event_type },
          { label: 'Recipient Role', value: selectedLog.recipient_role },
          { label: 'Delivery Status', value: selectedLog.delivery_status },
          { label: 'Created At', value: new Date(selectedLog.created_at).toLocaleString() },
        ] : []}
      />

        {/* Broadcast Modal */}
        {showBroadcast && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-lg">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">Broadcast Notification</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Title</label>
                  <input
                    className="input"
                    value={title}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Message</label>
                  <textarea
                    className="input h-24 resize-none"
                    value={body}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setBody(event.target.value)}
                    placeholder="Notification body..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Target Roles</label>
                  <div className="flex gap-3">
                    {['USER', 'MERCHANT', 'RIDER'].map((role) => (
                      <label key={role} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roles.includes(role)}
                          onChange={() => toggleRole(role)}
                          className="accent-primary"
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  className="btn-primary flex-1"
                  onClick={() => broadcastMut.mutate()}
                  disabled={!title || !body || broadcastMut.isPending}
                >
                  {broadcastMut.isPending ? 'Sending...' : 'Send Broadcast'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowBroadcast(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}

