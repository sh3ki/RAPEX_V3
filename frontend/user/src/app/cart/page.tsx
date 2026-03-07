'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Trash2, MapPin } from 'lucide-react';

interface CartItem { product_id: string; name: string; price: number; qty: number; }
interface CartData { store_id: string; store_name: string; items: CartItem[]; total: number; }

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<'WALLET' | 'CASH'>('WALLET');

  useEffect(() => {
    const raw = sessionStorage.getItem('cart');
    if (raw) setCart(JSON.parse(raw));
    else router.replace('/');
  }, [router]);

  const estimateMut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/delivery/fare-estimate/', { store_id: cart?.store_id, delivery_address: address });
      return data;
    },
    onSuccess: (data) => setFareEstimate(data.fare || data.estimated_fare || 0),
  });

  const placeOrderMut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/user/orders/', {
        store_id: cart?.store_id,
        delivery_address: address,
        note,
        payment_method: payMethod,
        items: cart?.items.map(i => ({ product_id: i.product_id, quantity: i.qty })),
      });
      return data;
    },
    onSuccess: (data) => {
      sessionStorage.removeItem('cart');
      router.push(`/orders/${data.id}`);
    },
  });

  const removeItem = (pid: string) => {
    if (!cart) return;
    const items = cart.items.filter(i => i.product_id !== pid);
    if (items.length === 0) { sessionStorage.removeItem('cart'); router.back(); return; }
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const updated = { ...cart, items, total };
    setCart(updated);
    sessionStorage.setItem('cart', JSON.stringify(updated));
  };

  if (!cart) return null;

  const grandTotal = cart.total + (fareEstimate || 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-dark-surface border border-dark-border"><ArrowLeft size={18} /></button>
        <h1 className="font-bold text-lg">Checkout</h1>
      </div>

      {/* Store info */}
      <div className="card !p-4">
        <p className="text-xs text-dark-muted">Ordering from</p>
        <p className="font-semibold">{cart.store_name}</p>
      </div>

      {/* Items */}
      <div className="card !p-4 space-y-3">
        <h2 className="font-semibold text-sm">Items</h2>
        {cart.items.map(item => (
          <div key={item.product_id} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{item.name} × {item.qty}</p>
              <p className="text-xs text-dark-muted">₦{(item.price * item.qty).toLocaleString()}</p>
            </div>
            <button onClick={() => removeItem(item.product_id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="border-t border-dark-border pt-2 flex justify-between text-sm font-semibold">
          <span>Subtotal</span><span>₦{cart.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Delivery address */}
      <div className="card !p-4 space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2"><MapPin size={14} /> Delivery Address</h2>
        <input className="input" placeholder="Enter delivery address" value={address} onChange={e => setAddress(e.target.value)} />
        {address && (
          <button onClick={() => estimateMut.mutate()} disabled={estimateMut.isPending} className="btn-secondary text-xs">
            {estimateMut.isPending ? 'Estimating…' : 'Get Delivery Estimate'}
          </button>
        )}
        {fareEstimate !== null && (
          <div className="flex justify-between text-sm"><span className="text-dark-muted">Delivery fee</span><span>₦{fareEstimate.toLocaleString()}</span></div>
        )}
      </div>

      {/* Note */}
      <div className="card !p-4 space-y-2">
        <h2 className="font-semibold text-sm">Note (optional)</h2>
        <input className="input" placeholder="Any special instructions?" value={note} onChange={e => setNote(e.target.value)} />
      </div>

      {/* Payment method */}
      <div className="card !p-4 space-y-3">
        <h2 className="font-semibold text-sm">Payment Method</h2>
        <div className="flex gap-3">
          {(['WALLET', 'CASH'] as const).map(m => (
            <button key={m} onClick={() => setPayMethod(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${payMethod === m ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-dark-border text-dark-muted'}`}>
              {m === 'WALLET' ? '💳 Wallet' : '💵 Cash'}
            </button>
          ))}
        </div>
      </div>

      {/* Total + place order */}
      <div className="card !p-4 space-y-3">
        <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary-500">₦{grandTotal.toLocaleString()}</span></div>
        <button
          onClick={() => placeOrderMut.mutate()}
          disabled={!address || placeOrderMut.isPending}
          className="btn-primary w-full !py-3 disabled:opacity-50"
        >
          {placeOrderMut.isPending ? 'Placing Order…' : 'Place Order'}
        </button>
        {placeOrderMut.isError && <p className="text-red-400 text-xs text-center">Failed to place order. Please try again.</p>}
      </div>
    </div>
  );
}
