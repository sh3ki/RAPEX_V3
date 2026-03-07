'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, MessageCircle, Navigation } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [riderLoc, setRiderLoc] = useState<{ lat: number; lng: number } | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => { const { data } = await api.get(`/user/orders/${id}/`); return data; },
    refetchInterval: 10_000,
  });

  // Poll rider location for in-transit orders
  useEffect(() => {
    if (!order || !['IN_TRANSIT', 'PICKED_UP', 'ACCEPTED'].includes(order.status)) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/delivery/rider-location/${id}/`);
        setRiderLoc(data);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [order, id]);

  const cancelMut = useMutation({
    mutationFn: async () => { await api.post(`/user/orders/${id}/cancel/`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  if (isLoading) return <div className="p-4"><div className="card animate-pulse h-60" /></div>;
  if (!order) return <div className="p-4 text-dark-muted">Order not found</div>;

  const canCancel = ['PENDING', 'PLACED'].includes(order.status);
  const isActive = ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-dark-surface border border-dark-border"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="font-bold">Order #{(order.id || '').slice(0, 8)}</h1>
          <p className="text-xs text-dark-muted">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Live tracking */}
      {isActive && (
        <div className="card !p-4 border-primary-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Navigation size={16} className="text-primary-500 animate-pulse" />
            <h2 className="font-semibold text-sm text-primary-500">Live Tracking</h2>
          </div>
          {order.rider_name && <p className="text-sm">Rider: <strong>{order.rider_name}</strong></p>}
          {order.rider_phone && (
            <div className="flex gap-2 mt-2">
              <a href={`tel:${order.rider_phone}`} className="btn-secondary text-xs flex items-center gap-1"><Phone size={12} /> Call</a>
              <Link href={`/chat?order=${id}`} className="btn-secondary text-xs flex items-center gap-1"><MessageCircle size={12} /> Chat</Link>
            </div>
          )}
          {riderLoc && <p className="text-xs text-dark-muted mt-2">Rider location: {riderLoc.lat.toFixed(4)}, {riderLoc.lng.toFixed(4)}</p>}
        </div>
      )}

      {/* Delivery info */}
      <div className="card !p-4 space-y-2">
        <h2 className="font-semibold text-sm flex items-center gap-2"><MapPin size={14} /> Delivery</h2>
        <p className="text-sm text-dark-muted">{order.delivery_address || 'N/A'}</p>
      </div>

      {/* Items */}
      <div className="card !p-4 space-y-2">
        <h2 className="font-semibold text-sm">Items</h2>
        {(order.items || []).map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{item.product_name || item.name} × {item.quantity || item.qty}</span>
            <span className="text-dark-muted">₦{parseFloat(item.subtotal || item.price || 0).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-dark-border pt-2 space-y-1">
          {order.delivery_fee && <div className="flex justify-between text-sm"><span className="text-dark-muted">Delivery fee</span><span>₦{parseFloat(order.delivery_fee).toLocaleString()}</span></div>}
          <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary-500">₦{parseFloat(order.total || 0).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Actions */}
      {canCancel && (
        <button onClick={() => { if (confirm('Cancel this order?')) cancelMut.mutate(); }} disabled={cancelMut.isPending} className="w-full py-3 rounded-lg border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 transition-colors">
          {cancelMut.isPending ? 'Cancelling…' : 'Cancel Order'}
        </button>
      )}
    </div>
  );
}
