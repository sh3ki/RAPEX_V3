'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { Wallet, CreditCard } from 'lucide-react';

interface TxnRow {
  id: string;
  wallet: string;
  type: string;
  amount: string;
  balance_after: string;
  description: string;
  created_at: string;
}

export default function WalletLedgerPage() {
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    owner_id: '',
    owner_type: 'RIDER',
    amount: '',
    adjustment_type: 'credit',
    reason: '',
  });

  const { data: txns = [], isLoading } = useQuery<TxnRow[]>({
    queryKey: ['sa-wallet-ledger'],
    queryFn: () => api.get('/superadmin/wallet-ledger/').then((r) => r.data),
  });

  const adjustMut = useMutation({
    mutationFn: () => api.post('/superadmin/wallet/adjust/', adjustForm),
    onSuccess: () => {
      alert('Wallet adjusted');
      setShowAdjust(false);
      setAdjustForm({ owner_id: '', owner_type: 'RIDER', amount: '', adjustment_type: 'credit', reason: '' });
    },
  });

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (r: TxnRow) => (
        <span className={r.type.includes('CREDIT') || r.type.includes('TOP_UP') ? 'text-green-400' : 'text-red-400'}>
          {r.type}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (r: TxnRow) => `₱${Number(r.amount).toLocaleString()}`,
    },
    {
      key: 'balance_after',
      label: 'Balance After',
      render: (r: TxnRow) => `₱${Number(r.balance_after).toLocaleString()}`,
    },
    { key: 'description', label: 'Description' },
    {
      key: 'created_at',
      label: 'Date',
      render: (r: TxnRow) => new Date(r.created_at).toLocaleString(),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wallet size={24} className="text-primary" /> Wallet Ledger
            </h1>
            <p className="text-dark-muted text-sm mt-1">Platform-wide transaction history</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdjust(true)}>
            <CreditCard size={16} /> Manual Adjust
          </button>
        </div>

        <DataTable
          columns={columns}
          data={txns}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          isLoading={isLoading}
        />

        {/* Adjust Modal */}
        {showAdjust && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-white">Manual Wallet Adjustment</h3>
              <input
                className="input"
                placeholder="Owner ID (UUID)"
                value={adjustForm.owner_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, owner_id: e.target.value })}
              />
              <select
                className="input"
                value={adjustForm.owner_type}
                onChange={(e) => setAdjustForm({ ...adjustForm, owner_type: e.target.value })}
              >
                <option value="USER">User</option>
                <option value="MERCHANT">Merchant</option>
                <option value="RIDER">Rider</option>
              </select>
              <input
                className="input"
                type="number"
                placeholder="Amount (₱)"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
              />
              <select
                className="input"
                value={adjustForm.adjustment_type}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              <textarea
                className="input h-20 resize-none"
                placeholder="Reason..."
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1"
                  onClick={() => adjustMut.mutate()}
                  disabled={!adjustForm.owner_id || !adjustForm.amount || adjustMut.isPending}
                >
                  {adjustMut.isPending ? 'Processing...' : 'Apply Adjustment'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowAdjust(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
