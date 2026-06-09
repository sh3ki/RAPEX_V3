'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface RemittanceRow {
  amount?: string;
  created_at?: string;
  status?: string;
  description?: string;
}

export default function OrdersPage() {
  const [selectedRemittance, setSelectedRemittance] = useState<RemittanceRow | null>(null);

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

  const remittanceRows: RemittanceRow[] = (remittances || []) as RemittanceRow[];

  const remittanceColumns = [
    {
      key: 'amount',
      label: 'Amount',
      render: (row: RemittanceRow) => `PHP ${parseFloat(row.amount || '0').toLocaleString()}`,
      sortValue: (row: RemittanceRow) => parseFloat(row.amount || '0'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: RemittanceRow) => <StatusBadge status={row.status || 'COMPLETED'} />,
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (row: RemittanceRow) => row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A',
      sortValue: (row: RemittanceRow) => row.created_at ? new Date(row.created_at).getTime() : 0,
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Orders"
        subtitle="Track active delivery and remittance history"
        breadcrumbs={[{ label: 'Rider Dashboard', href: '/' }, { label: 'Orders' }]}
      >

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
      <DataTable
        columns={remittanceColumns}
        data={remittanceRows}
        onRowClick={(row) => setSelectedRemittance(row)}
        searchPlaceholder="Search remittance amount, status, or date..."
      />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedRemittance)}
        title="Remittance Details"
        onClose={() => setSelectedRemittance(null)}
        rows={selectedRemittance ? [
          { label: 'Amount', value: `PHP ${parseFloat(selectedRemittance.amount || '0').toLocaleString()}` },
          { label: 'Status', value: selectedRemittance.status || 'COMPLETED' },
          { label: 'Created At', value: selectedRemittance.created_at ? new Date(selectedRemittance.created_at).toLocaleString() : 'N/A' },
          { label: 'Description', value: selectedRemittance.description || 'N/A' },
        ] : []}
      />
    </DashboardLayout>
  );
}
