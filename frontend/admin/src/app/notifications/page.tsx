'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Send, Bell } from 'lucide-react';

interface NotifRow {
  id: string;
  event_type: string;
  recipient_role: string;
  delivery_status: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [roles, setRoles] = useState<string[]>(['USER', 'MERCHANT', 'RIDER']);

  const { data: logs = [], isLoading } = useQuery<NotifRow[]>({
    queryKey: ['admin-notification-log'],
    queryFn: () => api.get('/admin-panel/notifications/log/').then((r) => r.data),
  });

  const broadcastMut = useMutation({
    mutationFn: () => api.post('/admin-panel/notifications/broadcast/', { title, body, roles }),
    onSuccess: (res) => {
      alert(`Broadcast sent to ${res.data.sent_to} users`);
      setShowBroadcast(false);
      setTitle('');
      setBody('');
    },
  });

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const columns = [
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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-dark-muted text-sm mt-1">Notification log & broadcast messaging</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowBroadcast(true)}>
            <Send size={16} /> Broadcast
          </button>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          isLoading={isLoading}
        />

        {/* Broadcast Modal */}
        {showBroadcast && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-lg">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-white">Broadcast Notification</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-muted mb-1">Title</label>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
                </div>
                <div>
                  <label className="block text-sm text-dark-muted mb-1">Message</label>
                  <textarea
                    className="input h-24 resize-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Notification body..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-muted mb-2">Target Roles</label>
                  <div className="flex gap-3">
                    {['USER', 'MERCHANT', 'RIDER'].map((role) => (
                      <label key={role} className="flex items-center gap-2 text-sm text-dark-text cursor-pointer">
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
      </main>
    </div>
  );
}
