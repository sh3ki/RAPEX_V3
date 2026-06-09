'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { Plus, UserCog, Edit2, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

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
  const [selectedAdmin, setSelectedAdmin] = useState<AdminRow | null>(null);
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

  const columns = [
    { key: 'full_name', label: 'Name', render: (row: AdminRow) => row.full_name || 'N/A' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', render: (row: AdminRow) => row.email || 'N/A' },
    { key: 'sub_role', label: 'Sub Role', render: (row: AdminRow) => row.sub_role || 'N/A' },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: AdminRow) => <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} />,
      sortValue: (row: AdminRow) => (row.is_active ? 1 : 0),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (row: AdminRow) => row.last_login ? new Date(row.last_login).toLocaleString() : 'Never',
      sortValue: (row: AdminRow) => row.last_login ? new Date(row.last_login).getTime() : 0,
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Admin Accounts"
        subtitle="Manage admin users"
        breadcrumbs={[{ label: 'SuperAdmin Dashboard', href: '/dashboard' }, { label: 'Admin Accounts' }]}
        actionSlot={
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Admin
          </button>
        }
      >
        <DataTable
          loading={isLoading}
          columns={columns}
          data={admins}
          onRowClick={(row) => setSelectedAdmin(row)}
          searchPlaceholder="Search by name, phone, role, or email..."
          getRowActions={(row) => [
            {
              label: 'Edit Admin',
              onClick: () => openEdit(row),
              icon: <Edit2 size={14} />,
            },
            {
              label: 'Deactivate Admin',
              onClick: () => {
                if (confirm('Deactivate this admin?')) {
                  deleteMut.mutate(row.id);
                }
              },
              icon: <Trash2 size={14} />,
              disabled: deleteMut.isPending,
            },
          ]}
        />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedAdmin)}
        title="Admin Details"
        onClose={() => setSelectedAdmin(null)}
        rows={selectedAdmin ? [
          { label: 'ID', value: selectedAdmin.id },
          { label: 'Name', value: selectedAdmin.full_name || 'N/A' },
          { label: 'Phone', value: selectedAdmin.phone },
          { label: 'Email', value: selectedAdmin.email || 'N/A' },
          { label: 'Sub Role', value: selectedAdmin.sub_role || 'N/A' },
          { label: 'Status', value: selectedAdmin.is_active ? 'Active' : 'Inactive' },
          { label: 'Last Login', value: selectedAdmin.last_login ? new Date(selectedAdmin.last_login).toLocaleString() : 'Never' },
        ] : []}
      />

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
    </DashboardLayout>
  );
}
