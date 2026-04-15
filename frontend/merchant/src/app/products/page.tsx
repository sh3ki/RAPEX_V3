'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Plus, Package } from 'lucide-react';

interface StoreRow { id: string; store_type: string; display_name: string; }
interface ProductRow { id: string; name: string; base_price: string; final_price: string; is_available: boolean; }

export default function ProductsPage() {
  const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', base_price: '', is_available: true });
  const queryClient = useQueryClient();

  const { data: stores = [] } = useQuery<StoreRow[]>({
    queryKey: ['merchant-stores'],
    queryFn: () => api.get('/merchant/stores/').then((r) => r.data),
  });

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

  const createMut = useMutation({
    mutationFn: () => {
      const url = getCreateUrl(selectedStore!);
      const payload: any = { ...form, base_price: form.base_price };
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
      queryClient.invalidateQueries({ queryKey: ['merchant-products', selectedStore?.id] });
    },
  });

  return (
    <DashboardLayout>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-1">Manage products across your stores</p>
          </div>
          {selectedStore && (
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>

        {/* Store Selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {stores.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStore(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStore?.id === s.id
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              {s.display_name}
            </button>
          ))}
          {stores.length === 0 && <p className="text-gray-500 text-sm">No stores. Create a store first.</p>}
        </div>

        {/* Products */}
        {!selectedStore ? (
          <div className="card text-center py-12">
            <Package size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a store to view its products</p>
          </div>
        ) : loadingProducts ? (
          <div className="text-gray-500 text-center py-12">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No products yet. Add your first product!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-gray-900 font-medium">{p.name || (p as any).title}</h3>
                  <span className={p.is_available ? 'badge-green' : 'badge-red'}>
                    {p.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">Base: ₱{Number(p.base_price || 0).toLocaleString()}</span>
                  <span className="text-primary font-semibold">Final: ₱{Number(p.final_price || p.base_price || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add {selectedStore?.store_type === 'PRELOVED' ? 'Item' : 'Product'}
              </h3>
              <input
                className="input"
                placeholder={selectedStore?.store_type === 'PRELOVED' ? 'Item title' : 'Product name'}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <textarea
                className="input h-20 resize-none"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              {selectedStore?.store_type !== 'READY_TO_EAT' && (
                <input
                  className="input"
                  type="number"
                  placeholder="Base price (₱)"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                />
              )}
              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1"
                  onClick={() => createMut.mutate()}
                  disabled={!form.name || createMut.isPending}
                >
                  {createMut.isPending ? 'Creating...' : 'Add'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}
