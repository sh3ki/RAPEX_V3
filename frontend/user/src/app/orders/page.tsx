'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => { const { data } = await api.get('/user/orders/list/'); return data?.results || data || []; },
    refetchInterval: 15_000,
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">My Orders</h1>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-20" />)}</div>
      ) : (data || []).length === 0 ? (
        <div className="text-center py-12 text-dark-muted">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-50" />
          <p>No orders yet</p>
          <Link href="/" className="text-primary-500 text-sm hover:underline mt-2 inline-block">Browse stores</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(data || []).map((o: any) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card flex items-center gap-3 !p-4 hover:border-primary-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={18} className="text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{o.store_name || `Order #${o.id?.slice(0,8)}`}</h3>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-xs text-dark-muted mt-0.5">
                  ₦{parseFloat(o.total || 0).toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight size={16} className="text-dark-muted flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
