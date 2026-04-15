'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
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
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time platform overview</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <StatCard title="Revenue Today" value={`₱${Number(data?.revenue_today || 0).toLocaleString()}`} change="+12.5%" trend="up" icon={DollarSign} color="green" />
          <StatCard title="Active Orders" value={String(data?.active_orders || 0)} change="+8.2%" trend="up" icon={ShoppingCart} color="blue" />
          <StatCard title="Total Users" value={String(data?.total_users || 0)} change="+5.1%" trend="up" icon={Users} color="primary" />
          <StatCard title="Active Merchants" value={String(data?.active_merchants || 0)} change="+3.4%" trend="up" icon={Store} color="purple" />
          <StatCard title="Active Riders" value={String(data?.active_riders || 0)} change="+6.7%" trend="up" icon={Bike} color="green" />
          <StatCard title="Platform Wallet" value={`₱${Number(data?.platform_wallet_total || 0).toLocaleString()}`} change="+15.3%" trend="up" icon={Wallet} color="primary" />
        </div>
      )}
    </DashboardLayout>
  );
}
