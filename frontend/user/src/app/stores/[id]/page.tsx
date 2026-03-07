'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Store as StoreIcon, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const typeApiMap: Record<string, string> = {
  SHOP: 'shop', FRESH_MARKET: 'fresh-market', READY_TO_EAT: 'ready-to-eat', PRELOVED: 'preloved',
};
const typeItemKey: Record<string, string> = {
  SHOP: 'products', FRESH_MARKET: 'products', READY_TO_EAT: 'items', PRELOVED: 'items',
};

interface CartItem { product_id: string; name: string; price: number; qty: number; }

export default function StoreDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => { const { data } = await api.get(`/merchant/stores/${id}/`); return data; },
  });

  const storeType = store?.store_type || 'SHOP';
  const apiPrefix = typeApiMap[storeType] || 'shop';

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['store-products', id, storeType],
    queryFn: async () => {
      const { data } = await api.get(`/merchant/${apiPrefix}/${id}/${typeItemKey[storeType] || 'products'}/`);
      return data?.results || data || [];
    },
    enabled: !!store,
  });

  const addToCart = (p: any) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.product_id === p.id);
      if (idx >= 0) { const n = [...prev]; n[idx].qty += 1; return n; }
      return [...prev, { product_id: p.id, name: p.name, price: parseFloat(p.price), qty: 1 }];
    });
  };

  const updateQty = (pid: string, delta: number) => {
    setCart(prev => prev.map(c => c.product_id === pid ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  };

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    sessionStorage.setItem('cart', JSON.stringify({ store_id: id, store_name: store?.name, items: cart, total }));
    router.push('/cart');
  };

  if (storeLoading) return <div className="p-4"><div className="card animate-pulse h-40" /></div>;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-dark-surface border border-dark-border"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">{store?.name}</h1>
          <p className="text-xs text-dark-muted">{store?.address || storeType.replace('_', ' ')}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${store?.is_open ? 'badge-green' : 'badge-red'}`}>
          {store?.is_open ? 'Open' : 'Closed'}
        </span>
      </div>

      {/* Products */}
      <h2 className="font-semibold text-sm text-dark-muted">Menu / Products</h2>
      {productsLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-16" />)}</div>
      ) : (products || []).length === 0 ? (
        <div className="text-center py-8 text-dark-muted">
          <StoreIcon size={40} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No products available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(products || []).map((p: any) => {
            const inCart = cart.find(c => c.product_id === p.id);
            return (
              <div key={p.id} className="card flex items-center gap-3 !p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{p.name}</h3>
                  {p.description && <p className="text-xs text-dark-muted truncate">{p.description}</p>}
                  <p className="text-primary-500 font-semibold text-sm mt-0.5">₦{parseFloat(p.price).toLocaleString()}</p>
                </div>
                {inCart ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(p.id, -1)} className="w-7 h-7 rounded-full bg-dark-border flex items-center justify-center"><Minus size={14} /></button>
                    <span className="text-sm font-semibold w-5 text-center">{inCart.qty}</span>
                    <button onClick={() => updateQty(p.id, 1)} className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center"><Plus size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(p)} className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors">
                    <Plus size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 z-40">
          <div className="max-w-lg mx-auto">
            <button onClick={handleCheckout} className="btn-primary w-full flex items-center justify-between !py-3">
              <span className="flex items-center gap-2"><ShoppingCart size={18} /> {totalItems} item{totalItems > 1 ? 's' : ''}</span>
              <span className="font-bold">₦{total.toLocaleString()} →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
