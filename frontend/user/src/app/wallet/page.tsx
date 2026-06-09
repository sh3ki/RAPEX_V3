'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Wallet, Star, ArrowUpRight, ArrowDownRight, Gift } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface WalletTxnRow {
  type?: string;
  amount?: string;
  description?: string;
  reference?: string;
  created_at?: string;
}

interface PointsRow {
  points: number;
  description?: string;
  reason?: string;
  created_at?: string;
}

export default function WalletPage() {
  const [selectedTxn, setSelectedTxn] = useState<WalletTxnRow | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<PointsRow | null>(null);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => { const { data } = await api.get('/user/wallet/'); return data; },
  });

  const { data: points } = useQuery({
    queryKey: ['points'],
    queryFn: async () => { const { data } = await api.get('/user/points/'); return data; },
  });

  const { data: pointsHistory } = useQuery({
    queryKey: ['points-history'],
    queryFn: async () => { const { data } = await api.get('/user/points/history/'); return data?.results || data || []; },
  });

  const balance = parseFloat(wallet?.balance || '0');
  const loyaltyPts = points?.points || points?.total || 0;
  const walletTxns: WalletTxnRow[] = (wallet?.transactions || []) as WalletTxnRow[];
  const pointsRows: PointsRow[] = (pointsHistory || []) as PointsRow[];

  const walletTxnColumns = [
    {
      key: 'direction',
      label: 'Direction',
      sortable: false,
      render: (row: WalletTxnRow) => {
        const isCredit = row.type === 'CREDIT' || parseFloat(row.amount || '0') > 0;
        return isCredit ? <ArrowDownRight size={16} className="text-green-400" /> : <ArrowUpRight size={16} className="text-red-400" />;
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (row: WalletTxnRow) => row.description || row.reference || 'Wallet entry',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row: WalletTxnRow) => {
        const amount = parseFloat(row.amount || '0');
        return `${amount > 0 ? '+' : '-'}PHP ${Math.abs(amount).toLocaleString()}`;
      },
      sortValue: (row: WalletTxnRow) => Math.abs(parseFloat(row.amount || '0')),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: WalletTxnRow) => row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A',
      sortValue: (row: WalletTxnRow) => row.created_at ? new Date(row.created_at).getTime() : 0,
    },
  ];

  const pointsColumns = [
    {
      key: 'description',
      label: 'Description',
      render: (row: PointsRow) => row.description || row.reason || 'Points entry',
    },
    {
      key: 'points',
      label: 'Points',
      render: (row: PointsRow) => `${row.points > 0 ? '+' : ''}${row.points} pts`,
      sortValue: (row: PointsRow) => row.points,
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: PointsRow) => row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A',
      sortValue: (row: PointsRow) => row.created_at ? new Date(row.created_at).getTime() : 0,
    },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Wallet"
        subtitle="Wallet balance, transactions, and loyalty points"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Wallet' }]}
      >

      {/* Balance card */}
      <div className="card bg-gradient-to-br from-primary-500/20 to-primary-500/5 border-primary-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center"><Wallet size={24} className="text-primary-500" /></div>
          <div>
            <p className="text-xs text-dark-muted">Balance</p>
            <p className="text-2xl font-bold">₦{balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Loyalty points */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Star size={24} className="text-yellow-400" /></div>
        <div className="flex-1">
          <p className="text-xs text-dark-muted">Loyalty Points</p>
          <p className="text-lg font-bold">{loyaltyPts.toLocaleString()} pts</p>
        </div>
        <Link href="/referral" className="text-primary-500 text-xs flex items-center gap-1"><Gift size={14} /> Refer</Link>
      </div>

      {/* Transaction history header */}
      <h2 className="font-semibold text-sm text-dark-muted">Wallet Transactions</h2>
      {walletTxns.length === 0 ? (
        <p className="text-center py-6 text-dark-muted text-sm">No transactions yet</p>
      ) : (
        <DataTable
          columns={walletTxnColumns}
          data={walletTxns}
          onRowClick={(row) => setSelectedTxn(row)}
          searchPlaceholder="Search wallet transactions..."
        />
      )}

      {/* Points history */}
      {pointsRows.length > 0 && (
        <>
          <h2 className="font-semibold text-sm text-dark-muted mt-4">Points History</h2>
          <DataTable
            columns={pointsColumns}
            data={pointsRows}
            onRowClick={(row) => setSelectedPoints(row)}
            searchPlaceholder="Search points history..."
          />
        </>
      )}
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedTxn)}
        title="Wallet Transaction Details"
        onClose={() => setSelectedTxn(null)}
        rows={selectedTxn ? [
          { label: 'Type', value: selectedTxn.type || 'N/A' },
          { label: 'Amount', value: `PHP ${Math.abs(parseFloat(selectedTxn.amount || '0')).toLocaleString()}` },
          { label: 'Description', value: selectedTxn.description || selectedTxn.reference || 'N/A' },
          { label: 'Created At', value: selectedTxn.created_at ? new Date(selectedTxn.created_at).toLocaleString() : 'N/A' },
        ] : []}
      />

      <TableRowDetailsModal
        open={Boolean(selectedPoints)}
        title="Points Entry Details"
        onClose={() => setSelectedPoints(null)}
        rows={selectedPoints ? [
          { label: 'Points', value: `${selectedPoints.points > 0 ? '+' : ''}${selectedPoints.points} pts` },
          { label: 'Description', value: selectedPoints.description || selectedPoints.reason || 'N/A' },
          { label: 'Created At', value: selectedPoints.created_at ? new Date(selectedPoints.created_at).toLocaleString() : 'N/A' },
        ] : []}
      />
    </DashboardLayout>
  );
}
