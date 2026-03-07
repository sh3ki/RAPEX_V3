'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bell, Check } from 'lucide-react';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const { data } = await api.get('/notifications/'); return data?.results || data || []; },
    refetchInterval: 15_000,
  });

  const markReadMut = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/notifications/${id}/read/`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Notifications</h1>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-16" />)}</div>
      ) : (data || []).length === 0 ? (
        <div className="text-center py-12 text-dark-muted">
          <Bell size={48} className="mx-auto mb-3 opacity-50" />
          <p>No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(data || []).map((n: any) => (
            <div key={n.id} className={`card !p-4 flex items-start gap-3 ${!n.is_read ? 'border-primary-500/30' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-dark-border' : 'bg-primary-500'}`} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{n.title}</h3>
                <p className="text-xs text-dark-muted mt-0.5">{n.message || n.body}</p>
                <p className="text-[10px] text-dark-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markReadMut.mutate(n.id)} className="text-dark-muted hover:text-primary-500 p-1" title="Mark read">
                  <Check size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
