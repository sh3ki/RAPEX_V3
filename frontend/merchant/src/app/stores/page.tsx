'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Plus, Store as StoreIcon, ToggleLeft, ToggleRight } from 'lucide-react';

interface StoreRow {
  id: string;
  store_type: string;
  display_name: string;
  description: string;
  is_open: boolean;
  is_accepting_delivery: boolean;
  is_accepting_pickup: boolean;
}

const STORE_TYPES = ['SHOP', 'FRESH_MARKET', 'READY_TO_EAT', 'PRELOVED'];

export default function StoresPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ store_type: 'SHOP', display_name: '', description: '' });
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading } = useQuery<StoreRow[]>({
    queryKey: ['merchant-stores'],
    queryFn: () => api.get('/merchant/stores/').then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/merchant/stores/create/', form),
    onSuccess: () => {
      setShowCreate(false);
      setForm({ store_type: 'SHOP', display_name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['merchant-stores'] });
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, open }: { id: string; open: boolean }) =>
      api.patch(`/merchant/stores/${id}/${open ? 'open' : 'close'}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-stores'] }),
  });

  return (
    <DashboardLayout>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Stores</h1>
            <p className="text-sm text-gray-500 mt-1">Manage up to 4 stores (one per type)</p>
          </div>
          {stores.length < 4 && (
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Store
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-gray-500 text-center py-20">Loading stores...</div>
        ) : stores.length === 0 ? (
          <div className="card text-center py-12">
            <StoreIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No stores yet. Create your first store to start selling!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {stores.map((s) => (
              <div key={s.id} className="card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-gray-900 font-semibold text-lg">{s.display_name}</h3>
                    <span className="badge-blue">{s.store_type.replace(/_/g, ' ')}</span>
                  </div>
                  <StatusBadge status={s.is_open ? 'Open' : 'Closed'} />
                </div>
                {s.description && <p className="text-gray-500 text-sm">{s.description}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{s.is_accepting_delivery ? '✓ Delivery' : '✗ Delivery'}</span>
                  <span>{s.is_accepting_pickup ? '✓ Pickup' : '✗ Pickup'}</span>
                </div>
                <button
                  onClick={() => toggleMut.mutate({ id: s.id, open: !s.is_open })}
                  className={`flex items-center gap-2 text-sm font-medium ${
                    s.is_open ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                  }`}
                >
                  {s.is_open ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {s.is_open ? 'Close Store' : 'Open Store'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-white">Create New Store</h3>
              <select
                className="input"
                value={form.store_type}
                onChange={(e) => setForm({ ...form, store_type: e.target.value })}
              >
                {STORE_TYPES.filter((t) => !stores.some((s) => s.store_type === t)).map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Store display name"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
              <textarea
                className="input h-24 resize-none"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1"
                  onClick={() => createMut.mutate()}
                  disabled={!form.display_name || createMut.isPending}
                >
                  {createMut.isPending ? 'Creating...' : 'Create Store'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}
