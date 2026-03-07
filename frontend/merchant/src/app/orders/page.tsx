'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { CheckCircle, XCircle, PackageCheck } from 'lucide-react';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_amount: string;
  delivery_mode: string;
  created_at: string;
  items_count?: number;
}

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<OrderRow[]>({
    queryKey: ['merchant-orders'],
    queryFn: () => api.get('/merchant/orders/').then((r) => r.data.results || r.data || []),
    refetchInterval: 10_000,
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => api.patch(`/merchant/orders/${id}/accept/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-orders'] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/merchant/orders/${id}/reject/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-orders'] }),
  });

  const pickupMut = useMutation({
    mutationFn: (id: string) => api.patch(`/merchant/orders/${id}/pickup-confirmed/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-orders'] }),
  });

  const groupedOrders = {
    pending: orders.filter((o) => o.status === 'PENDING_MERCHANT'),
    active: orders.filter((o) => ['PREPARING', 'COOKING', 'READY_FOR_PICKUP'].includes(o.status)),
    awaiting_pickup: orders.filter((o) => o.status === 'ASSIGNED'),
    completed: orders.filter((o) => ['DELIVERED', 'IN_TRANSIT', 'PICKED_UP'].includes(o.status)),
  };

  const renderOrderCard = (order: OrderRow) => (
    <div key={order.id} className="card flex items-center justify-between">
      <div>
        <p className="text-white font-medium">#{order.order_number}</p>
        <p className="text-dark-muted text-xs">
          {new Date(order.created_at).toLocaleString()} · {order.delivery_mode || '—'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white font-semibold">₱{Number(order.total_amount).toLocaleString()}</span>
        <StatusBadge status={order.status} />
        {order.status === 'PENDING_MERCHANT' && (
          <div className="flex gap-2">
            <button
              onClick={() => acceptMut.mutate(order.id)}
              className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs font-medium"
              disabled={acceptMut.isPending}
            >
              <CheckCircle size={16} /> Accept
            </button>
            <button
              onClick={() => rejectMut.mutate(order.id)}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium"
              disabled={rejectMut.isPending}
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        )}
        {order.status === 'ASSIGNED' && (
          <button
            onClick={() => pickupMut.mutate(order.id)}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium"
            disabled={pickupMut.isPending}
          >
            <PackageCheck size={16} /> Confirm Pickup
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-dark-muted text-sm mt-1">Manage incoming and active orders</p>
        </div>

        {isLoading ? (
          <div className="text-dark-muted text-center py-20">Loading orders...</div>
        ) : (
          <div className="space-y-8">
            {/* Pending */}
            {groupedOrders.pending.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-yellow-400 mb-3">
                  Pending ({groupedOrders.pending.length})
                </h2>
                <div className="space-y-3">{groupedOrders.pending.map(renderOrderCard)}</div>
              </section>
            )}

            {/* Active */}
            {groupedOrders.active.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-blue-400 mb-3">
                  Active ({groupedOrders.active.length})
                </h2>
                <div className="space-y-3">{groupedOrders.active.map(renderOrderCard)}</div>
              </section>
            )}

            {/* Awaiting Pickup */}
            {groupedOrders.awaiting_pickup.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-purple-400 mb-3">
                  Awaiting Rider Pickup ({groupedOrders.awaiting_pickup.length})
                </h2>
                <div className="space-y-3">{groupedOrders.awaiting_pickup.map(renderOrderCard)}</div>
              </section>
            )}

            {/* Recent Completed */}
            <section>
              <h2 className="text-lg font-semibold text-green-400 mb-3">
                Recent ({groupedOrders.completed.length})
              </h2>
              {groupedOrders.completed.length > 0 ? (
                <div className="space-y-3">{groupedOrders.completed.slice(0, 10).map(renderOrderCard)}</div>
              ) : (
                <p className="text-dark-muted text-sm">No recent completed orders</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
