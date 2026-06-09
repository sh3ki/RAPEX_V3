'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

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
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  // Orders are fetched from the general orders endpoint (admin can view all)
  const { data: orders = [], isLoading } = useQuery<OrderRow[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      // Admin has access to all orders via the admin panel — we'll use the daily report
      // as a proxy until a dedicated admin order list endpoint exists.
      // For now, show a stub that follows the same structure.
      try {
        const res = await api.get('/admin/reports/daily/');
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
    <DashboardLayout>
      <TablePageLayout
        title="Orders"
        subtitle="Platform order overview"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/dashboard' }, { label: 'Orders' }]}
      >
        <DataTable
          loading={isLoading}
          columns={columns}
          data={orders}
          onRowClick={(row) => setSelectedOrder(row)}
          searchPlaceholder="Search by order, customer, merchant, or status..."
        />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedOrder)}
        title="Order Details"
        onClose={() => setSelectedOrder(null)}
        rows={selectedOrder ? [
          { label: 'ID', value: selectedOrder.id },
          { label: 'Order #', value: selectedOrder.order_number },
          { label: 'Status', value: selectedOrder.status },
          { label: 'Amount', value: `PHP ${Number(selectedOrder.total_amount || 0).toLocaleString()}` },
          { label: 'Customer', value: selectedOrder.customer_phone || 'N/A' },
          { label: 'Merchant', value: selectedOrder.merchant_name || 'N/A' },
        ] : []}
      />
    </DashboardLayout>
  );
}

