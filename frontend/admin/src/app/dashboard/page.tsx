'use client';

import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-dark-muted text-sm mt-1">Real-time platform overview</p>
        </div>

        {isLoading ? (
          <div className="text-dark-muted text-center py-20">Loading dashboard...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Revenue Today"
                value={`₱${Number(data?.revenue_today || 0).toLocaleString()}`}
                icon={DollarSign}
                color="text-green-400"
              />
              <StatCard
                label="Active Orders"
                value={data?.active_orders ?? 0}
                icon={ShoppingCart}
                color="text-blue-400"
              />
              <StatCard
                label="Active Riders"
                value={data?.active_riders ?? 0}
                icon={Bike}
                color="text-purple-400"
              />
              <StatCard
                label="Completed Today"
                value={data?.completed_today ?? 0}
                icon={CheckCircle}
                color="text-green-400"
              />
            </div>

            {/* Pending KYC Section */}
            <h2 className="text-lg font-semibold text-white mb-4">Pending KYC Approvals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="User KYC Pending"
                value={data?.pending_kyc.users ?? 0}
                icon={Users}
                color="text-yellow-400"
              />
              <StatCard
                label="Merchant KYC Pending"
                value={data?.pending_kyc.merchants ?? 0}
                icon={Store}
                color="text-yellow-400"
              />
              <StatCard
                label="Rider KYC Pending"
                value={data?.pending_kyc.riders ?? 0}
                icon={Bike}
                color="text-yellow-400"
              />
            </div>

            {/* Quick Stats Bar */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-dark-muted" />
                  <span className="text-sm text-dark-muted">Total Orders Today:</span>
                  <span className="text-white font-semibold">{data?.total_orders_today ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-yellow-400" />
                  <span className="text-sm text-dark-muted">Total Pending KYC:</span>
                  <span className="text-yellow-400 font-semibold">{totalPendingKYC}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
