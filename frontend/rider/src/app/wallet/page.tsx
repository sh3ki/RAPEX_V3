'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface RemittanceRow {
  type?: string;
  amount?: string;
  description?: string;
  reference?: string;
  created_at?: string;
  status?: string;
}

export default function WalletPage() {
  const [selectedRemittance, setSelectedRemittance] = useState<RemittanceRow | null>(null);

  const { data: dash } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: async () => { const { data } = await api.get('/rider/dashboard/'); return data; },
  });

  const { data: remittances } = useQuery({
    queryKey: ['remittances'],
    queryFn: async () => { const { data } = await api.get('/rider/remittance/'); return data?.results || data || []; },
  });

  const balance = parseFloat(dash?.wallet_balance || '0');
  const remittanceRows: RemittanceRow[] = (remittances || []) as RemittanceRow[];

  const remittanceColumns = [
    {
      key: 'direction',
      label: 'Direction',
      sortable: false,
      render: (row: RemittanceRow) => {
        const isDebit = row.type === 'DEBIT' || parseFloat(row.amount || '0') < 0;
        return isDebit ? <ArrowUpRight size={16} className="text-red-400" /> : <ArrowDownRight size={16} className="text-green-400" />;
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (row: RemittanceRow) => row.description || row.reference || 'Remittance',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row: RemittanceRow) => {
        const amount = parseFloat(row.amount || '0');
        const isDebit = row.type === 'DEBIT' || amount < 0;
        return `${isDebit ? '-' : '+'}PHP ${Math.abs(amount).toLocaleString()}`;
      },
      sortValue: (row: RemittanceRow) => Math.abs(parseFloat(row.amount || '0')),
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
        title="Wallet"
        subtitle="Balance, earnings snapshot, and remittance records"
        breadcrumbs={[{ label: 'Rider Dashboard', href: '/' }, { label: 'Wallet' }]}
      >

      {/* Balance */}
      <div className="card bg-gradient-to-br from-primary-500/20 to-primary-500/5 border-primary-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center"><WalletIcon size={24} className="text-primary-500" /></div>
          <div>
            <p className="text-xs text-dark-muted">Wallet Balance</p>
            <p className="text-2xl font-bold">₦{balance.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="text-center">
            <p className="text-xs text-dark-muted">Today&apos;s Earnings</p>
            <p className="font-bold text-green-400">₦{parseFloat(dash?.earnings_today || '0').toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-dark-muted">Today&apos;s Deliveries</p>
            <p className="font-bold">{dash?.deliveries_today || 0}</p>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="card !p-4 border-blue-500/20">
        <p className="text-xs text-dark-muted">
          💡 Your wallet is auto-debited at pickup and commission is deducted on delivery. Overdue remittances are auto-deducted on wallet top-up.
        </p>
      </div>

      {/* Remittance records */}
      <h2 className="font-semibold text-sm text-dark-muted flex items-center gap-2"><Receipt size={14} /> Remittance Records</h2>
      <DataTable
        columns={remittanceColumns}
        data={remittanceRows}
        onRowClick={(row) => setSelectedRemittance(row)}
        searchPlaceholder="Search remittance entries..."
      />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedRemittance)}
        title="Remittance Entry Details"
        onClose={() => setSelectedRemittance(null)}
        rows={selectedRemittance ? [
          { label: 'Type', value: selectedRemittance.type || 'N/A' },
          { label: 'Amount', value: `PHP ${Math.abs(parseFloat(selectedRemittance.amount || '0')).toLocaleString()}` },
          { label: 'Description', value: selectedRemittance.description || selectedRemittance.reference || 'N/A' },
          { label: 'Created At', value: selectedRemittance.created_at ? new Date(selectedRemittance.created_at).toLocaleString() : 'N/A' },
          { label: 'Status', value: selectedRemittance.status || 'N/A' },
        ] : []}
      />
    </DashboardLayout>
  );
}
