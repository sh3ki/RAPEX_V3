'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Wallet, Star, ArrowUpRight, ArrowDownRight, Gift } from 'lucide-react';
import Link from 'next/link';

export default function WalletPage() {
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

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Wallet</h1>

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
      {(wallet?.transactions || []).length === 0 ? (
        <p className="text-center py-6 text-dark-muted text-sm">No transactions yet</p>
      ) : (
        <div className="space-y-2">
          {(wallet?.transactions || []).map((tx: any, i: number) => {
            const isCredit = tx.type === 'CREDIT' || parseFloat(tx.amount) > 0;
            return (
              <div key={i} className="card !p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {isCredit ? <ArrowDownRight size={16} className="text-green-400" /> : <ArrowUpRight size={16} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description || tx.reference || (isCredit ? 'Credit' : 'Debit')}</p>
                  <p className="text-[10px] text-dark-muted">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-semibold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                  {isCredit ? '+' : '-'}₦{Math.abs(parseFloat(tx.amount)).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Points history */}
      {(pointsHistory || []).length > 0 && (
        <>
          <h2 className="font-semibold text-sm text-dark-muted mt-4">Points History</h2>
          <div className="space-y-2">
            {(pointsHistory || []).map((p: any, i: number) => (
              <div key={i} className="card !p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">{p.description || p.reason || 'Points'}</p>
                  <p className="text-[10px] text-dark-muted">{new Date(p.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-semibold text-sm ${p.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {p.points > 0 ? '+' : ''}{p.points} pts
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
