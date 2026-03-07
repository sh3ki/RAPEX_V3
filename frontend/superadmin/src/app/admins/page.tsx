'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Plus, UserCog, Edit2, Trash2 } from 'lucide-react';

interface AdminRow {
  id: string;
  phone: string;
  email: string | null;
  full_name: string | null;
  sub_role: string | null;
  is_active: boolean;
  last_login: string | null;
}

export default function AdminsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: '', email: '', full_name: '', sub_role: 'OPERATIONS', password: '' });
  const [editForm, setEditForm] = useState({ full_name: '', sub_role: '', is_active: true });
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading } = useQuery<AdminRow[]>({
    queryKey: ['sa-admins'],
    queryFn: () => api.get('/superadmin/admins/').then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/superadmin/admins/', form),
    onSuccess: () => {
      setShowCreate(false);
      setForm({ phone: '', email: '', full_name: '', sub_role: 'OPERATIONS', password: '' });
      queryClient.invalidateQueries({ queryKey: ['sa-admins'] });
    },
  });

  const updateMut = useMutation({
    mutationFn: (id: string) => api.patch(`/superadmin/admins/${id}/`, editForm),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['sa-admins'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/superadmin/admins/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sa-admins'] }),
  });

  const openEdit = (admin: AdminRow) => {
    setEditingId(admin.id);
    setEditForm({ full_name: admin.full_name || '', sub_role: admin.sub_role || 'OPERATIONS', is_active: admin.is_active });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserCog size={24} className="text-primary" /> Admin Accounts
            </h1>
            <p className="text-dark-muted text-sm mt-1">Manage admin users</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Admin
          </button>
        </div>

        {isLoading ? (
          <div className="text-dark-muted text-center py-20">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {admins.map((a) => (
              <div key={a.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {(a.full_name || a.phone || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{a.full_name || a.phone}</p>
                    <p className="text-dark-muted text-xs">{a.phone} · {a.sub_role || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${a.is_active ? 'badge-green' : 'badge-red'}`}>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => openEdit(a)} className="text-blue-400 hover:text-blue-300">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Deactivate this admin?')) deleteMut.mutate(a.id); }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-white">Create Admin Account</h3>
              <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className="input" value={form.sub_role} onChange={(e) => setForm({ ...form, sub_role: e.target.value })}>
                <option value="OPERATIONS">Operations</option>
                <option value="FINANCE">Finance</option>
                <option value="SUPPORT">Support</option>
                <option value="MARKETING">Marketing</option>
              </select>
              <div className="flex gap-3">
                <button className="btn-primary flex-1" onClick={() => createMut.mutate()} disabled={!form.phone || createMut.isPending}>
                  {createMut.isPending ? 'Creating...' : 'Create'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-white">Edit Admin</h3>
              <input className="input" placeholder="Full name" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              <select className="input" value={editForm.sub_role} onChange={(e) => setEditForm({ ...editForm, sub_role: e.target.value })}>
                <option value="OPERATIONS">Operations</option>
                <option value="FINANCE">Finance</option>
                <option value="SUPPORT">Support</option>
                <option value="MARKETING">Marketing</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-dark-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="accent-primary"
                />
                Active
              </label>
              <div className="flex gap-3">
                <button className="btn-primary flex-1" onClick={() => updateMut.mutate(editingId)} disabled={updateMut.isPending}>
                  {updateMut.isPending ? 'Saving...' : 'Save'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
