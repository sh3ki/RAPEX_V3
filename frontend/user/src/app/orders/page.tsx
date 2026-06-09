'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, TablePageLayout } from '@shared/components/table';

interface UserOrderRow {
  id: string;
  store_name?: string;
  status: string;
  total?: string;
  created_at: string;
}

export default function OrdersPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery<UserOrderRow[]>({
    queryKey: ['orders'],
    queryFn: async () => { const { data } = await api.get('/user/orders/list/'); return data?.results || data || []; },
    refetchInterval: 15_000,
  });

  const rows = data || [];

  const columns = [
    {
      key: 'store_name',
      label: 'Store',
      render: (row: UserOrderRow) => row.store_name || `Order #${row.id?.slice(0, 8)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: UserOrderRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'total',
      label: 'Total',
      render: (row: UserOrderRow) => `PHP ${parseFloat(row.total || '0').toLocaleString()}`,
      sortValue: (row: UserOrderRow) => parseFloat(row.total || '0'),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: UserOrderRow) => new Date(row.created_at).toLocaleDateString(),
      sortValue: (row: UserOrderRow) => new Date(row.created_at).getTime(),
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="My Orders"
        subtitle="Track all order activity and status"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Orders' }]}
      >
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-20" />)}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-dark-muted">
            <ShoppingBag size={48} className="mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
            <Link href="/" className="text-primary-500 text-sm hover:underline mt-2 inline-block">Browse stores</Link>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Search store, status, amount, or date..."
            onRowClick={(row) => router.push(`/orders/${row.id}`)}
          />
        )}
      </TablePageLayout>
    </DashboardLayout>
  );
}
