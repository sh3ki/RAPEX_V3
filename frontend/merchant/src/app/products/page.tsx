'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Plus, Package } from 'lucide-react';
import { DataTable, TablePageLayout, TableRowDetailsModal } from '@shared/components/table';
import { Button, Dropdown, Input } from '@shared/components/ui';
import type { SelectOption } from '@shared/types';

interface StoreRow { id: string; store_type: string; display_name: string; }
interface ProductRow { id: string; name: string; base_price: string; final_price: string; is_available: boolean; }

const AVAILABILITY_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Available', description: 'Visible and purchasable by customers.' },
  { value: 'false', label: 'Unavailable', description: 'Hidden from active purchase flows.' },
];

export default function ProductsPage() {
  const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', base_price: '', is_available: true });
  const [createError, setCreateError] = useState('');
  const queryClient = useQueryClient();

  const { data: stores = [] } = useQuery<StoreRow[]>({
    queryKey: ['merchant-stores'],
    queryFn: () => api.get('/merchant/stores/').then((r) => r.data),
  });

  useEffect(() => {
    if (!selectedStore && stores.length > 0) {
      setSelectedStore(stores[0]);
    }
  }, [selectedStore, stores]);

  // Determine the correct product endpoint based on store type
  const getProductUrl = (store: StoreRow) => {
    const typeMap: Record<string, string> = {
      SHOP: `/merchant/shop/${store.id}/products/`,
      FRESH_MARKET: `/merchant/fresh-market/${store.id}/products/`,
      READY_TO_EAT: `/merchant/ready-to-eat/${store.id}/items/`,
      PRELOVED: `/merchant/preloved/${store.id}/items/`,
    };
    return typeMap[store.store_type] || `/merchant/shop/${store.id}/products/`;
  };

  const getCreateUrl = (store: StoreRow) => {
    if (store.store_type === 'SHOP') return `/merchant/shop/${store.id}/products/create/`;
    return getProductUrl(store); // POST to list endpoint for others
  };

  const { data: products = [], isLoading: loadingProducts } = useQuery<ProductRow[]>({
    queryKey: ['merchant-products', selectedStore?.id],
    queryFn: () => api.get(getProductUrl(selectedStore!)).then((r) => r.data.results || r.data || []),
    enabled: !!selectedStore,
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
    mutationFn: () => {
      if (!selectedStore) {
        throw new Error('Please select a store before adding a product.');
      }

      if (!form.name.trim()) {
        throw new Error(selectedStore.store_type === 'PRELOVED' ? 'Item title is required.' : 'Product name is required.');
      }

      if (selectedStore.store_type !== 'READY_TO_EAT' && !form.base_price) {
        throw new Error('Base price is required.');
      }

      const url = getCreateUrl(selectedStore!);
      const payload: Record<string, string | boolean> = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        base_price: form.base_price,
      };

      // For ready_to_eat, we create menu items without a price (variants have prices)
      if (selectedStore?.store_type === 'READY_TO_EAT') delete payload.base_price;
      // For preloved, rename name to title
      if (selectedStore?.store_type === 'PRELOVED') {
        payload.title = payload.name;
        payload.condition = 'GOOD';
        delete payload.name;
      }
      return api.post(url, payload);
    },
    onSuccess: () => {
      setShowCreate(false);
      setForm({ name: '', description: '', base_price: '', is_available: true });
      setCreateError('');
      queryClient.invalidateQueries({ queryKey: ['merchant-products', selectedStore?.id] });
    },
    onError: (error: unknown) => {
      setCreateError(getCreateErrorMessage(error) || 'Unable to add product. Please review your inputs.');
    },
  });

  const openCreateModal = () => {
    setForm({ name: '', description: '', base_price: '', is_available: true });
    setCreateError('');
    setShowCreate(true);
  };

  const closeCreateModal = () => {
    if (createMut.isPending) {
      return;
    }
    setShowCreate(false);
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row: ProductRow) => row.name || (row as any).title || 'N/A' },
    {
      key: 'base_price',
      label: 'Base Price',
      render: (row: ProductRow) => `PHP ${Number(row.base_price || 0).toLocaleString()}`,
      sortValue: (row: ProductRow) => Number(row.base_price || 0),
    },
    {
      key: 'final_price',
      label: 'Final Price',
      render: (row: ProductRow) => `PHP ${Number(row.final_price || row.base_price || 0).toLocaleString()}`,
      sortValue: (row: ProductRow) => Number(row.final_price || row.base_price || 0),
    },
    {
      key: 'is_available',
      label: 'Availability',
      render: (row: ProductRow) => (
        <span className={row.is_available ? 'badge-green' : 'badge-red'}>
          {row.is_available ? 'Available' : 'Unavailable'}
        </span>
      ),
      sortValue: (row: ProductRow) => (row.is_available ? 1 : 0),
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Products"
        subtitle="Manage products across your stores"
        breadcrumbs={[{ label: 'Merchant Dashboard', href: '/dashboard' }, { label: 'Products' }]}
        actionSlot={selectedStore ? (
          <Button variant="primary" size="md" className="flex items-center gap-2" onClick={openCreateModal}>
            <Plus size={16} /> Add Product
          </Button>
        ) : undefined}
      >
        {!selectedStore ? (
          <div className="card text-center py-12">
            <Package size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a store to view its products.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={products}
            loading={loadingProducts}
            onRowClick={(row) => setSelectedProduct(row)}
            searchPlaceholder="Search product name, pricing, or status..."
            tabs={stores.map((store) => ({
              value: store.id,
              label: store.display_name,
              count: selectedStore?.id === store.id ? products.length : undefined,
            }))}
            activeTab={selectedStore.id}
            onTabChange={(value) => {
              const matched = stores.find((store) => store.id === value);
              if (matched) {
                setSelectedStore(matched);
              }
            }}
            filterByTab={() => true}
          />
        )}
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedProduct)}
        title="Product Details"
        onClose={() => setSelectedProduct(null)}
        rows={selectedProduct ? [
          { label: 'ID', value: selectedProduct.id },
          { label: 'Name', value: selectedProduct.name || (selectedProduct as any).title || 'N/A' },
          { label: 'Base Price', value: `PHP ${Number(selectedProduct.base_price || 0).toLocaleString()}` },
          { label: 'Final Price', value: `PHP ${Number(selectedProduct.final_price || selectedProduct.base_price || 0).toLocaleString()}` },
          { label: 'Available', value: selectedProduct.is_available ? 'Yes' : 'No' },
        ] : []}
      />

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setCreateError('');
                createMut.mutate();
              }}
            >
              <h3 className="text-xl font-semibold text-slate-900">
                Add {selectedStore?.store_type === 'PRELOVED' ? 'Item' : 'Product'}
              </h3>

              <Input
                label={selectedStore?.store_type === 'PRELOVED' ? 'Item Title' : 'Product Name'}
                placeholder={selectedStore?.store_type === 'PRELOVED' ? 'Item title' : 'Product name'}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={createMut.isPending}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={createMut.isPending}
                  rows={4}
                />
              </div>

              {selectedStore?.store_type !== 'READY_TO_EAT' && (
                <Input
                  label="Base Price (PHP)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Base price (₱)"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                  disabled={createMut.isPending}
                />
              )}

              <Dropdown
                label="Availability"
                value={String(form.is_available)}
                options={AVAILABILITY_OPTIONS}
                onChange={(value) => setForm({ ...form, is_available: value === 'true' })}
                disabled={createMut.isPending}
              />

              {createError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createError}
                </p>
              ) : null}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={createMut.isPending}
                  disabled={!form.name.trim() || (selectedStore?.store_type !== 'READY_TO_EAT' && !form.base_price)}
                >
                  Add
                </Button>
                <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={closeCreateModal}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
    </DashboardLayout>
  );
}
