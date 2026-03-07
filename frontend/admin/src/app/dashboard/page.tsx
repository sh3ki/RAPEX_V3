'use client';

import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import api from '@/lib/api';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Store,
  Bike,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface DashboardData {
  revenue_today: string;
  active_orders: number;
  pending_kyc: { users: number; merchants: number; riders: number };
  active_riders: number;
  total_orders_today: number;
  completed_today: number;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin-panel/dashboard/').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const totalPendingKYC = data
    ? data.pending_kyc.users + data.pending_kyc.merchants + data.pending_kyc.riders
    : 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time platform overview</p>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-center py-20">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <StatCard title="Revenue Today" value={`₱${Number(data?.revenue_today || 0).toLocaleString()}`} change="+12.5%" trend="up" icon={DollarSign} color="green" />
            <StatCard title="Active Orders" value={String(data?.active_orders ?? 0)} change="+8.2%" trend="up" icon={ShoppingCart} color="blue" />
            <StatCard title="Active Riders" value={String(data?.active_riders ?? 0)} change="+6.7%" trend="up" icon={Bike} color="purple" />
            <StatCard title="Completed Today" value={String(data?.completed_today ?? 0)} change="+4.1%" trend="up" icon={CheckCircle} color="green" />
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending KYC Approvals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatCard title="User KYC Pending" value={String(data?.pending_kyc.users ?? 0)} change="Needs review" trend="down" icon={Users} color="primary" />
            <StatCard title="Merchant KYC Pending" value={String(data?.pending_kyc.merchants ?? 0)} change="Needs review" trend="down" icon={Store} color="primary" />
            <StatCard title="Rider KYC Pending" value={String(data?.pending_kyc.riders ?? 0)} change="Needs review" trend="down" icon={Bike} color="primary" />
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                <span className="text-sm text-gray-500">Total Orders Today:</span>
                <span className="text-gray-900 font-semibold">{data?.total_orders_today ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <span className="text-sm text-gray-500">Total Pending KYC:</span>
                <span className="text-amber-600 font-semibold">{totalPendingKYC}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
