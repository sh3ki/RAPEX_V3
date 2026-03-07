'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const { data: activeOrder } = useQuery({
    queryKey: ['active-order'],
    queryFn: async () => {
      try { const { data } = await api.get('/rider/orders/active/'); return data; }
      catch { return null; }
    },
    refetchInterval: 8_000,
  });

  const { data: remittances } = useQuery({
    queryKey: ['remittances'],
    queryFn: async () => { const { data } = await api.get('/rider/remittance/'); return data?.results || data || []; },
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Orders</h1>

      {/* Active order */}
      {activeOrder && activeOrder.id ? (
        <>
          <h2 className="font-semibold text-sm text-dark-muted">Active Delivery</h2>
          <Link href={`/orders/${activeOrder.id}`} className="card border-primary-500/30 !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
              <Package size={18} className="text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">Order #{(activeOrder.id || '').slice(0, 8)}</h3>
                <StatusBadge status={activeOrder.status} />
              </div>
              <p className="text-xs text-dark-muted truncate mt-0.5">{activeOrder.delivery_address}</p>
            </div>
            <ChevronRight size={16} className="text-dark-muted" />
          </Link>
        </>
      ) : (
        <div className="card text-center !p-8">
          <Package size={40} className="mx-auto mb-3 text-dark-muted opacity-50" />
          <p className="text-dark-muted text-sm">No active delivery</p>
          <p className="text-xs text-dark-muted mt-1">Go online to receive delivery requests</p>
        </div>
      )}

      {/* Remittance history */}
      <h2 className="font-semibold text-sm text-dark-muted">Remittance History</h2>
      {(remittances || []).length === 0 ? (
        <p className="text-center py-4 text-dark-muted text-xs">No remittance records</p>
      ) : (
        <div className="space-y-2">
          {(remittances || []).map((r: any, i: number) => (
            <div key={i} className="card !p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">₦{parseFloat(r.amount || 0).toLocaleString()}</p>
                <p className="text-[10px] text-dark-muted">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <StatusBadge status={r.status || 'COMPLETED'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
