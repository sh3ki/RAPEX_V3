'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function WalletPage() {
  const { data: dash } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: async () => { const { data } = await api.get('/rider/dashboard/'); return data; },
  });

  const { data: remittances } = useQuery({
    queryKey: ['remittances'],
    queryFn: async () => { const { data } = await api.get('/rider/remittance/'); return data?.results || data || []; },
  });

  const balance = parseFloat(dash?.wallet_balance || '0');

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Wallet</h1>

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
      {(remittances || []).length === 0 ? (
        <p className="text-center py-6 text-dark-muted text-sm">No remittance records</p>
      ) : (
        <div className="space-y-2">
          {(remittances || []).map((r: any, i: number) => {
            const isDebit = r.type === 'DEBIT' || parseFloat(r.amount) < 0;
            return (
              <div key={i} className="card !p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDebit ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                  {isDebit ? <ArrowUpRight size={16} className="text-red-400" /> : <ArrowDownRight size={16} className="text-green-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.description || r.reference || (isDebit ? 'Remittance' : 'Top-up')}</p>
                  <p className="text-[10px] text-dark-muted">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-semibold text-sm ${isDebit ? 'text-red-400' : 'text-green-400'}`}>
                  {isDebit ? '-' : '+'}₦{Math.abs(parseFloat(r.amount)).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
