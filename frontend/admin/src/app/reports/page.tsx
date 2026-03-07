'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type ReportType = 'daily' | 'weekly' | 'store-type';

const COLORS = ['#FF6B00', '#7C3AED', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('daily');

  const { data: dailyData, isLoading: loadingDaily } = useQuery({
    queryKey: ['admin-report-daily'],
    queryFn: () => api.get('/admin-panel/reports/daily/').then((r) => r.data),
    enabled: activeTab === 'daily',
  });

  const { data: weeklyData, isLoading: loadingWeekly } = useQuery({
    queryKey: ['admin-report-weekly'],
    queryFn: () => api.get('/admin-panel/reports/weekly/').then((r) => r.data),
    enabled: activeTab === 'weekly',
  });

  const { data: storeTypeData, isLoading: loadingStore } = useQuery({
    queryKey: ['admin-report-store-type'],
    queryFn: () => api.get('/admin-panel/reports/by-store-type/').then((r) => r.data),
    enabled: activeTab === 'store-type',
  });

  const tabs: { key: ReportType; label: string }[] = [
    { key: 'daily', label: 'Daily Report' },
    { key: 'weekly', label: 'Weekly Report' },
    { key: 'store-type', label: 'By Store Type' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-dark-muted text-sm mt-1">Revenue and performance analytics</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-primary text-white'
                  : 'bg-dark-surface text-dark-muted hover:text-white border border-dark-border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Daily */}
        {activeTab === 'daily' && (
          <div className="card">
            {loadingDaily ? (
              <p className="text-dark-muted py-8 text-center">Loading...</p>
            ) : dailyData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-dark-muted text-sm">Total Revenue</p>
                    <p className="text-xl font-bold text-white">₱{Number(dailyData.total_revenue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-dark-muted text-sm">Total Orders</p>
                    <p className="text-xl font-bold text-white">{dailyData.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-dark-muted text-sm">Commission Earned</p>
                    <p className="text-xl font-bold text-green-400">₱{Number(dailyData.commission || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-dark-muted text-sm">Avg Order Value</p>
                    <p className="text-xl font-bold text-white">₱{Number(dailyData.avg_order_value || 0).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-dark-muted py-8 text-center">No daily report data</p>
            )}
          </div>
        )}

        {/* Weekly */}
        {activeTab === 'weekly' && (
          <div className="card">
            {loadingWeekly ? (
              <p className="text-dark-muted py-8 text-center">Loading...</p>
            ) : weeklyData?.daily_breakdown ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData.daily_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-dark-muted py-8 text-center">No weekly data</p>
            )}
          </div>
        )}

        {/* By Store Type */}
        {activeTab === 'store-type' && (
          <div className="card">
            {loadingStore ? (
              <p className="text-dark-muted py-8 text-center">Loading...</p>
            ) : storeTypeData?.breakdown ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storeTypeData.breakdown}
                        dataKey="revenue"
                        nameKey="store_type"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {storeTypeData.breakdown.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {storeTypeData.breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm text-white">{item.store_type}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">₱{Number(item.revenue || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-dark-muted py-8 text-center">No store type data</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
