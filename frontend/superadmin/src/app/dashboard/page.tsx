'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import {
  DollarSign, ShoppingCart, Users, Store, Bike, Wallet
} from 'lucide-react';

async function fetchDashboard() {
  const { data } = await api.get('/superadmin/dashboard/');
  return data.data || data;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['sa-dashboard'], queryFn: fetchDashboard, refetchInterval: 30000 });

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h2 className="text-2xl font-bold mb-6">Platform Dashboard</h2>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-dark-surface border border-dark-border rounded-xl p-6 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <StatCard title="Revenue Today" value={`₱${data?.revenue_today || 0}`} icon={<DollarSign size={20} />} />
            <StatCard title="Active Orders" value={data?.active_orders || 0} icon={<ShoppingCart size={20} />} color="text-secondary" />
            <StatCard title="Total Users" value={data?.total_users || 0} icon={<Users size={20} />} />
            <StatCard title="Active Merchants" value={data?.active_merchants || 0} icon={<Store size={20} />} />
            <StatCard title="Active Riders" value={data?.active_riders || 0} icon={<Bike size={20} />} color="text-green-400" />
            <StatCard title="Platform Wallet" value={`₱${data?.platform_wallet_total || 0}`} icon={<Wallet size={20} />} color="text-yellow-400" />
          </div>
        )}
      </main>
    </div>
  );
}
