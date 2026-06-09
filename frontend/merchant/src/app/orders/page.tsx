'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { CheckCircle, XCircle, PackageCheck } from 'lucide-react';
import { DataTable, TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

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
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'awaiting_pickup' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
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

  const columns = [
    { key: 'order_number', label: 'Order #' },
    {
      key: 'status',
      label: 'Status',
      render: (row: OrderRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'delivery_mode',
      label: 'Delivery Mode',
      render: (row: OrderRow) => row.delivery_mode || 'N/A',
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (row: OrderRow) => `PHP ${Number(row.total_amount || 0).toLocaleString()}`,
      sortValue: (row: OrderRow) => Number(row.total_amount || 0),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: OrderRow) => new Date(row.created_at).toLocaleString(),
      sortValue: (row: OrderRow) => new Date(row.created_at).getTime(),
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Orders"
        subtitle="Manage incoming and active orders"
        breadcrumbs={[{ label: 'Merchant Dashboard', href: '/dashboard' }, { label: 'Orders' }]}
      >
        <DataTable
          loading={isLoading}
          columns={columns}
          data={orders}
          onRowClick={(row) => setSelectedOrder(row)}
          tabs={[
            { value: 'all', label: 'All', count: orders.length },
            { value: 'pending', label: 'Pending', count: groupedOrders.pending.length },
            { value: 'active', label: 'Active', count: groupedOrders.active.length },
            { value: 'awaiting_pickup', label: 'Awaiting Pickup', count: groupedOrders.awaiting_pickup.length },
            { value: 'completed', label: 'Completed', count: groupedOrders.completed.length },
          ]}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as typeof activeTab)}
          filterByTab={(row, tab) => {
            if (tab === 'all') {
              return true;
            }
            if (tab === 'pending') {
              return row.status === 'PENDING_MERCHANT';
            }
            if (tab === 'active') {
              return ['PREPARING', 'COOKING', 'READY_FOR_PICKUP'].includes(row.status);
            }
            if (tab === 'awaiting_pickup') {
              return row.status === 'ASSIGNED';
            }
            return ['DELIVERED', 'IN_TRANSIT', 'PICKED_UP'].includes(row.status);
          }}
          getRowActions={(row) => {
            if (row.status === 'PENDING_MERCHANT') {
              return [
                {
                  label: 'Accept Order',
                  onClick: () => acceptMut.mutate(row.id),
                  icon: <CheckCircle size={14} />,
                  disabled: acceptMut.isPending,
                },
                {
                  label: 'Reject Order',
                  onClick: () => rejectMut.mutate(row.id),
                  icon: <XCircle size={14} />,
                  disabled: rejectMut.isPending,
                },
              ];
            }

            if (row.status === 'ASSIGNED') {
              return [
                {
                  label: 'Confirm Pickup',
                  onClick: () => pickupMut.mutate(row.id),
                  icon: <PackageCheck size={14} />,
                  disabled: pickupMut.isPending,
                },
              ];
            }

            return [];
          }}
        />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedOrder)}
        title="Order Details"
        onClose={() => setSelectedOrder(null)}
        rows={selectedOrder ? [
          { label: 'Order #', value: selectedOrder.order_number },
          { label: 'Status', value: selectedOrder.status },
          { label: 'Delivery Mode', value: selectedOrder.delivery_mode || 'N/A' },
          { label: 'Amount', value: `PHP ${Number(selectedOrder.total_amount || 0).toLocaleString()}` },
          { label: 'Created At', value: new Date(selectedOrder.created_at).toLocaleString() },
        ] : []}
      />
    </DashboardLayout>
  );
}
