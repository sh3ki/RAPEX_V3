'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Eye, Plus, Store as StoreIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { DataTable, TablePageLayout, TableRowDetailsModal } from '@shared/components/table';
import { Button, Dropdown, Input, ProfileImageUpload } from '@shared/components/ui';
import type { SelectOption } from '@shared/types';

interface StoreRow {
  id: string;
  store_type: string;
  display_name: string;
  description: string;
  is_open: boolean;
  is_accepting_delivery: boolean;
  is_accepting_pickup: boolean;
}

const STORE_OPTIONS: SelectOption[] = [
  {
    value: 'SHOP',
    label: 'General Merchandise',
    description: 'Everyday household, retail, pharmacy, and convenience items.',
  },
  {
    value: 'FRESH_MARKET',
    label: 'Fresh Market',
    description: 'Vegetables, fruits, meat, seafood, and perishable essentials.',
  },
  {
    value: 'READY_TO_EAT',
    label: 'Ready-to-Eat',
    description: 'Cooked meals, snacks, beverages, and food menu offerings.',
  },
  {
    value: 'PRELOVED',
    label: 'Pre-loved',
    description: 'Second-hand items, collectibles, and resale inventory.',
  },
];

export default function StoresPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
  const [form, setForm] = useState({ store_type: 'SHOP', display_name: '', description: '' });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [createError, setCreateError] = useState('');
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading } = useQuery<StoreRow[]>({
    queryKey: ['merchant-stores'],
    queryFn: () => api.get('/merchant/stores/').then((r) => r.data),
  });

  const getCreateErrorMessage = (error: unknown) => {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const maybeError = error as {
      message?: string;
      response?: { data?: { message?: string; detail?: string } };
    };

    return maybeError.response?.data?.message || maybeError.response?.data?.detail || maybeError.message || null;
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!availableStoreOptions.length) {
        throw new Error('All store categories are already created.');
      }

      if (!availableStoreOptions.some((option) => option.value === form.store_type)) {
        throw new Error('Please select a valid store category.');
      }

      if (!form.display_name.trim()) {
        throw new Error('Store display name is required.');
      }

      if (!profileImage) {
        throw new Error('Store profile image is required.');
      }

      const payload = new FormData();
      payload.append('store_type', form.store_type);
      payload.append('display_name', form.display_name.trim());
      payload.append('description', form.description.trim());
      payload.append('profile_image', profileImage);
      payload.append('is_accepting_delivery', 'true');
      payload.append('is_accepting_pickup', 'true');

      return api.post('/merchant/stores/create/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      setShowCreate(false);
      setForm({ store_type: availableStoreOptions[0]?.value || 'SHOP', display_name: '', description: '' });
      setProfileImage(null);
      setCreateError('');
      queryClient.invalidateQueries({ queryKey: ['merchant-stores'] });
    },
    onError: (error: unknown) => {
      setCreateError(getCreateErrorMessage(error) || 'Unable to create store. Please check your inputs.');
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, open }: { id: string; open: boolean }) =>
      api.patch(`/merchant/stores/${id}/${open ? 'open' : 'close'}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-stores'] }),
  });

  const columns = [
    { key: 'display_name', label: 'Store Name' },
    { key: 'store_type', label: 'Store Type', render: (row: StoreRow) => row.store_type.replaceAll('_', ' ') },
    {
      key: 'is_open',
      label: 'Status',
      render: (row: StoreRow) => <StatusBadge status={row.is_open ? 'Open' : 'Closed'} />,
      sortValue: (row: StoreRow) => (row.is_open ? 1 : 0),
    },
    {
      key: 'delivery_pickup',
      label: 'Delivery/Pickup',
      sortable: false,
      render: (row: StoreRow) => `${row.is_accepting_delivery ? 'Delivery' : 'No Delivery'} · ${row.is_accepting_pickup ? 'Pickup' : 'No Pickup'}`,
    },
  ];

  const availableStoreOptions = useMemo(
    () => STORE_OPTIONS.filter((option) => !stores.some((store) => store.store_type === option.value)),
    [stores],
  );

  useEffect(() => {
    if (!availableStoreOptions.length) {
      return;
    }

    if (!availableStoreOptions.some((option) => option.value === form.store_type)) {
      setForm((prev) => ({ ...prev, store_type: availableStoreOptions[0].value }));
    }
  }, [availableStoreOptions, form.store_type]);

  const openCreateModal = () => {
    if (!availableStoreOptions.length) {
      return;
    }

    setForm({ store_type: availableStoreOptions[0].value, display_name: '', description: '' });
    setProfileImage(null);
    setCreateError('');
    setShowCreate(true);
  };

  const closeCreateModal = () => {
    if (createMut.isPending) {
      return;
    }
    setShowCreate(false);
  };

  return (
    <DashboardLayout>
      <TablePageLayout
        title="My Stores"
        subtitle="Manage up to 4 stores, one per type"
        breadcrumbs={[{ label: 'Merchant Dashboard', href: '/dashboard' }, { label: 'Stores' }]}
        actionSlot={stores.length < 4 ? (
          <Button variant="primary" size="md" className="flex items-center gap-2" onClick={openCreateModal}>
            <Plus size={16} /> Create Store
          </Button>
        ) : undefined}
      >
        {stores.length === 0 && !isLoading ? (
          <div className="card text-center py-12">
            <StoreIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No stores yet. Create your first store to start selling.</p>
          </div>
        ) : (
          <DataTable
            loading={isLoading}
            columns={columns}
            data={stores}
            onRowClick={(row) => router.push(`/stores/${row.id}`)}
            searchPlaceholder="Search by store name, type, or status..."
            getRowActions={(row) => [
              {
                label: 'Quick View',
                onClick: () => setSelectedStore(row),
                icon: <Eye size={14} />,
              },
              {
                label: row.is_open ? 'Close Store' : 'Open Store',
                onClick: () => toggleMut.mutate({ id: row.id, open: !row.is_open }),
                icon: row.is_open ? <ToggleRight size={14} /> : <ToggleLeft size={14} />,
                disabled: toggleMut.isPending,
              },
            ]}
          />
        )}
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedStore)}
        title="Store Details"
        onClose={() => setSelectedStore(null)}
        rows={selectedStore ? [
          { label: 'ID', value: selectedStore.id },
          { label: 'Store Name', value: selectedStore.display_name },
          { label: 'Store Type', value: selectedStore.store_type.replaceAll('_', ' ') },
          { label: 'Status', value: selectedStore.is_open ? 'Open' : 'Closed' },
          { label: 'Description', value: selectedStore.description || 'N/A' },
          { label: 'Accepting Delivery', value: selectedStore.is_accepting_delivery ? 'Yes' : 'No' },
          { label: 'Accepting Pickup', value: selectedStore.is_accepting_pickup ? 'Yes' : 'No' },
        ] : []}
      />

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form
              className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setCreateError('');
                createMut.mutate();
              }}
            >
              <h3 className="text-xl font-semibold text-slate-900">Create New Store</h3>
              <p className="text-sm text-slate-600">
                Set up your store with a clear profile image and category. Each merchant can only create one store per category.
              </p>

              <Dropdown
                label="Store Category"
                value={form.store_type}
                options={availableStoreOptions}
                onChange={(value) => setForm({ ...form, store_type: value })}
                placeholder="Select store category"
                disabled={createMut.isPending}
              />

              <Input
                label="Store Display Name"
                placeholder="Store display name"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                disabled={createMut.isPending}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Description (Optional)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={createMut.isPending}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <ProfileImageUpload
                  label="Store Profile Image"
                  file={profileImage}
                  initials="S"
                  maxSizeMB={5}
                  disabled={createMut.isPending}
                  onValidationError={(message) => setCreateError(message)}
                  onFileChange={(file) => {
                    setCreateError('');
                    setProfileImage(file);
                  }}
                />
                <p className="text-xs text-slate-500">Required. This image is used as your circular store profile in listings.</p>
              </div>

              {createError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createError}
                </p>
              ) : null}

              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={closeCreateModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={createMut.isPending}
                  disabled={!form.display_name.trim() || !profileImage || !availableStoreOptions.length}
                >
                  Create Store
                </Button>
              </div>
            </form>
          </div>
        )}
    </DashboardLayout>
  );
}
