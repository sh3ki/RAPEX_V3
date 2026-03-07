'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Settings, Save } from 'lucide-react';

export default function SettingsPage() {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ['sa-settings'],
    queryFn: () => api.get('/superadmin/settings/').then((r) => r.data),
  });

  const saveMut = useMutation({
    mutationFn: () => api.patch('/superadmin/settings/', formData),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['sa-settings'] });
    },
  });

  const startEditing = () => {
    setFormData({ ...settings });
    setEditing(true);
  };

  const updateField = (key: string, value: string) => {
    setFormData((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings size={24} className="text-primary" /> Platform Settings
            </h1>
            <p className="text-dark-muted text-sm mt-1">Manage global platform configuration</p>
          </div>
          {!editing ? (
            <button className="btn-primary" onClick={startEditing}>Edit Settings</button>
          ) : (
            <div className="flex gap-2">
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
              >
                <Save size={16} /> {saveMut.isPending ? 'Saving...' : 'Save All'}
              </button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-dark-muted text-center py-20">Loading settings...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(editing ? formData : settings).map(([key, value]) => (
              <div key={key} className="card">
                <label className="block text-sm text-dark-muted mb-2 font-medium uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </label>
                {editing ? (
                  <input
                    className="input"
                    value={formData[key] || ''}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                ) : (
                  <p className="text-white font-semibold">{value || '—'}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
