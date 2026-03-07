'use client';

import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_amount: string;
  created_at: string;
  customer_phone?: string;
  merchant_name?: string;
}

export default function OrdersPage() {
  // Orders are fetched from the general orders endpoint (admin can view all)
  const { data: orders = [], isLoading } = useQuery<OrderRow[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      // Admin has access to all orders via the admin panel — we'll use the daily report
      // as a proxy until a dedicated admin order list endpoint exists.
      // For now, show a stub that follows the same structure.
      try {
        const res = await api.get('/admin-panel/reports/daily/');
        return res.data.orders || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 15_000,
  });

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_phone', label: 'Customer' },
    { key: 'merchant_name', label: 'Merchant' },
    {
      key: 'status',
      label: 'Status',
      render: (r: OrderRow) => <StatusBadge status={r.status} />,
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (r: OrderRow) => `₱${Number(r.total_amount || 0).toLocaleString()}`,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (r: OrderRow) => r.created_at ? new Date(r.created_at).toLocaleString() : '—',
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-dark-muted text-sm mt-1">Platform order overview</p>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
