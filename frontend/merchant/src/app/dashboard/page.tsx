'use client';

import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { ShoppingCart, DollarSign, Store, Clock } from 'lucide-react';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_amount: string;
  created_at: string;
}

export default function DashboardPage() {
  const { data: orders = [] } = useQuery<OrderRow[]>({
    queryKey: ['merchant-orders'],
    queryFn: () => api.get('/merchant/orders/').then((r) => r.data.results || r.data || []),
    refetchInterval: 15_000,
  });

  const { data: stores = [] } = useQuery<any[]>({
    queryKey: ['merchant-stores'],
    queryFn: () => api.get('/merchant/stores/').then((r) => r.data),
  });

  const pendingOrders = orders.filter((o) => o.status === 'PENDING_MERCHANT');
  const activeOrders = orders.filter((o) => ['PREPARING', 'COOKING', 'IN_TRANSIT'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Merchant Dashboard</h1>
          <p className="text-dark-muted text-sm mt-1">Manage orders and your stores</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard label="Pending Orders" value={pendingOrders.length} icon={Clock} color="text-yellow-400" />
          <StatCard label="Active Orders" value={activeOrders.length} icon={ShoppingCart} color="text-blue-400" />
          <StatCard label="Completed" value={completedOrders.length} icon={ShoppingCart} color="text-green-400" />
          <StatCard label="Revenue" value={`₱${totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-green-400" />
        </div>

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-yellow-400" /> Pending Orders
            </h2>
            <div className="grid gap-3">
              {pendingOrders.slice(0, 5).map((o) => (
                <div key={o.id} className="card flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Order #{o.order_number}</p>
                    <p className="text-dark-muted text-xs">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">₱{Number(o.total_amount).toLocaleString()}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stores */}
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Store size={20} className="text-primary" /> My Stores
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {stores.map((s: any) => (
            <div key={s.id} className="card flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{s.display_name}</p>
                <p className="text-dark-muted text-xs">{s.store_type}</p>
              </div>
              <StatusBadge status={s.is_open ? 'Open' : 'Closed'} />
            </div>
          ))}
          {stores.length === 0 && (
            <p className="text-dark-muted text-sm col-span-2">No stores yet. Create one from My Stores page.</p>
          )}
        </div>
      </main>
    </div>
  );
}
