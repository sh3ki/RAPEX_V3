'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { ShieldBan, Plus } from 'lucide-react';

interface BlacklistRow {
  id: string;
  subject_id: string;
  subject_role: string;
  reason: string;
  is_permanent: boolean;
  created_at: string;
}

export default function BlacklistPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ subject_id: '', subject_role: 'USER', reason: '', is_permanent: true });
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery<BlacklistRow[]>({
    queryKey: ['sa-blacklist'],
    queryFn: () => api.get('/superadmin/fraud/blacklist/').then((r) => r.data),
  });

  const addMut = useMutation({
    mutationFn: () => api.post('/superadmin/fraud/blacklist/', form),
    onSuccess: () => {
      setShowAdd(false);
      setForm({ subject_id: '', subject_role: 'USER', reason: '', is_permanent: true });
      queryClient.invalidateQueries({ queryKey: ['sa-blacklist'] });
    },
  });

  const columns = [
    { key: 'subject_id', label: 'Subject ID', render: (r: BlacklistRow) => r.subject_id.slice(0, 12) + '...' },
    { key: 'subject_role', label: 'Role' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'is_permanent',
      label: 'Type',
      render: (r: BlacklistRow) => (
        <span className={r.is_permanent ? 'badge-red' : 'badge-yellow'}>
          {r.is_permanent ? 'Permanent' : 'Temporary'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (r: BlacklistRow) => new Date(r.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldBan size={24} className="text-red-400" /> Blacklist
            </h1>
            <p className="text-dark-muted text-sm mt-1">Blacklisted accounts</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add to Blacklist
          </button>
        </div>

        <DataTable columns={columns} data={entries} />

        {showAdd && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-white">Blacklist Account</h3>
              <input className="input" placeholder="Subject ID (UUID)" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} />
              <select className="input" value={form.subject_role} onChange={(e) => setForm({ ...form, subject_role: e.target.value })}>
                <option value="USER">User</option>
                <option value="MERCHANT">Merchant</option>
                <option value="RIDER">Rider</option>
              </select>
              <textarea className="input h-20 resize-none" placeholder="Reason..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-dark-text cursor-pointer">
                <input type="checkbox" checked={form.is_permanent} onChange={(e) => setForm({ ...form, is_permanent: e.target.checked })} className="accent-primary" />
                Permanent ban
              </label>
              <div className="flex gap-3">
                <button className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700" onClick={() => addMut.mutate()} disabled={!form.subject_id || !form.reason || addMut.isPending}>
                  {addMut.isPending ? 'Processing...' : 'Blacklist'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

