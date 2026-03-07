'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Store, User, Navigation, CheckCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useState } from 'react';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [deliverError, setDeliverError] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['active-order', id],
    queryFn: async () => { const { data } = await api.get('/rider/orders/active/'); return data; },
    refetchInterval: 5_000,
  });

  const deliverMut = useMutation({
    mutationFn: async () => {
      return new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await api.post(`/rider/orders/${id}/deliver/`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
              resolve();
            } catch (e: any) {
              reject(e?.response?.data?.detail || 'Delivery confirmation failed. Must be within 50m of delivery address.');
            }
          },
          () => reject('GPS unavailable. Please enable location services.')
        );
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['active-order'] }); router.push('/orders'); },
    onError: (err: any) => setDeliverError(typeof err === 'string' ? err : 'Failed to confirm delivery'),
  });

  if (isLoading) return <div className="p-4"><div className="card animate-pulse h-60" /></div>;
  if (!order) return <div className="p-4 text-dark-muted">No active order</div>;

  const statusSteps = ['RIDER_ASSIGNED', 'FOR_PICKUP', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
  const currentIdx = statusSteps.indexOf(order.status);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-dark-surface border border-dark-border"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="font-bold">Delivery #{(order.id || '').slice(0, 8)}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress steps */}
      <div className="card !p-4">
        <h2 className="font-semibold text-sm mb-3">Progress</h2>
        <div className="flex gap-1">
          {statusSteps.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= currentIdx ? 'bg-primary-500' : 'bg-dark-border'}`} />
          ))}
        </div>
        <p className="text-xs text-dark-muted mt-2">{order.status?.replace(/_/g, ' ')}</p>
      </div>

      {/* Merchant info */}
      <div className="card !p-4 space-y-2">
        <h2 className="font-semibold text-sm flex items-center gap-2"><Store size={14} /> Pickup</h2>
        <p className="text-sm">{order.store_name || 'Merchant'}</p>
        <p className="text-xs text-dark-muted">{order.pickup_address || order.store_address || 'See store details'}</p>
      </div>

      {/* Customer info */}
      <div className="card !p-4 space-y-2">
        <h2 className="font-semibold text-sm flex items-center gap-2"><User size={14} /> Deliver to</h2>
        <p className="text-sm">{order.customer_name || 'Customer'}</p>
        <p className="text-xs text-dark-muted flex items-center gap-1"><MapPin size={12} /> {order.delivery_address}</p>
      </div>

      {/* Order items */}
      <div className="card !p-4 space-y-2">
        <h2 className="font-semibold text-sm">Items</h2>
        {(order.items || []).map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{item.product_name || item.name} × {item.quantity || item.qty}</span>
            <span className="text-dark-muted">₦{parseFloat(item.subtotal || item.price || 0).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-dark-border pt-2 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary-500">₦{parseFloat(order.total || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Confirm delivery action */}
      {['IN_TRANSIT', 'PICKED_UP'].includes(order.status) && (
        <div className="space-y-2">
          <button
            onClick={() => { setDeliverError(''); deliverMut.mutate(); }}
            disabled={deliverMut.isPending}
            className="btn-primary w-full !py-4 text-lg flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            {deliverMut.isPending ? 'Confirming…' : 'Confirm Delivery'}
          </button>
          {deliverError && <p className="text-red-400 text-xs text-center">{deliverError}</p>}
          <p className="text-[10px] text-dark-muted text-center">GPS must be within 50m of delivery address</p>
        </div>
      )}
    </div>
  );
}
