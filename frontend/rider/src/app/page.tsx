'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Power, Bike, DollarSign, Wallet, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RiderHomePage() {
  const qc = useQueryClient();
  const [ping, setPing] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);

  const { data: dash } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: async () => { const { data } = await api.get('/rider/dashboard/'); return data; },
    refetchInterval: 10_000,
  });

  const { data: activeOrder } = useQuery({
    queryKey: ['active-order'],
    queryFn: async () => {
      try { const { data } = await api.get('/rider/orders/active/'); return data; }
      catch { return null; }
    },
    refetchInterval: 8_000,
  });

  const isOnline = dash?.is_online ?? false;

  const toggleMut = useMutation({
    mutationFn: async () => { await api.patch('/rider/online/'); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-dashboard'] }),
  });

  useEffect(() => {
    if (!isOnline) return;
    const sendLocation = () => {
      navigator.geolocation?.getCurrentPosition(
        (pos) => { api.post('/rider/location/update/', { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {}); },
        () => {}
      );
    };
    sendLocation();
    const interval = setInterval(sendLocation, 10_000);
    return () => clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return;
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('http', 'ws').replace('/api/v1', '');
    const token = document.cookie.split('; ').find(c => c.startsWith('access_token='))?.split('=')[1];
    if (!token) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${wsUrl}/ws/rider/?token=${token}`);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'rider.ping' || msg.type === 'delivery_request') {
          setPing(msg.data || msg);
          setCountdown(180);
        }
      };
    } catch {}
    return () => { ws?.close(); };
  }, [isOnline]);

  useEffect(() => {
    if (countdown <= 0) { if (ping) setPing(null); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, ping]);

  const acceptMut = useMutation({
    mutationFn: async (orderId: string) => { await api.post(`/rider/orders/${orderId}/accept/`); },
    onSuccess: () => { setPing(null); setCountdown(0); qc.invalidateQueries({ queryKey: ['active-order'] }); },
  });
  const rejectMut = useMutation({
    mutationFn: async (orderId: string) => { await api.post(`/rider/orders/${orderId}/reject/`); },
    onSuccess: () => { setPing(null); setCountdown(0); },
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rider Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your deliveries</p>
      </div>

      {/* Go Online / Offline toggle */}
      <button
        onClick={() => toggleMut.mutate()}
        disabled={toggleMut.isPending}
        className={`w-full py-6 rounded-2xl font-bold text-lg flex flex-col items-center gap-2 transition-all mb-6 ${isOnline ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-600' : 'bg-red-50 border-2 border-red-200 text-red-500'}`}
      >
        <Power size={40} />
        {toggleMut.isPending ? 'Updating...' : isOnline ? 'You are ONLINE' : 'Go ONLINE'}
      </button>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="card text-center py-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <Bike size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dash?.deliveries_today || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Deliveries Today</p>
        </div>
        <div className="card text-center py-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <DollarSign size={20} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₱{parseFloat(dash?.earnings_today || '0').toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Earnings Today</p>
        </div>
        <div className="card text-center py-6">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <Wallet size={20} className="text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₱{parseFloat(dash?.wallet_balance || '0').toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Wallet Balance</p>
        </div>
      </div>

      {/* Active order */}
      {activeOrder && activeOrder.id && (
        <Link href={`/orders/${activeOrder.id}`} className="card border-primary-300 mb-6 block hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm text-primary-600 flex items-center gap-2"><MapPin size={14} /> Active Delivery</h2>
            <span className="badge-blue">{activeOrder.status}</span>
          </div>
          <p className="text-sm text-gray-900">Order #{(activeOrder.id || '').slice(0, 8)}</p>
          <p className="text-xs text-gray-500">{activeOrder.delivery_address}</p>
          <p className="text-xs text-primary-500 mt-2">Tap to view details →</p>
        </Link>
      )}

      {/* Delivery Ping */}
      {ping && (
        <div className="fixed inset-x-0 bottom-4 p-4 z-50">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-primary-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-primary-600 flex items-center gap-2"><Bike size={18} /> New Delivery Request!</h2>
              <span className="text-sm font-mono text-red-500">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
            </div>
            {ping.store_name && <p className="text-sm text-gray-700">From: <strong>{ping.store_name}</strong></p>}
            {ping.delivery_address && <p className="text-xs text-gray-500">To: {ping.delivery_address}</p>}
            {ping.total && <p className="text-sm font-semibold text-gray-900">₱{parseFloat(ping.total).toLocaleString()}</p>}
            <div className="flex gap-3">
              <button onClick={() => rejectMut.mutate(ping.order_id || ping.id)} disabled={rejectMut.isPending} className="flex-1 py-3 rounded-lg border border-red-300 text-red-500 font-semibold hover:bg-red-50 transition-colors">
                Reject
              </button>
              <button onClick={() => acceptMut.mutate(ping.order_id || ping.id)} disabled={acceptMut.isPending} className="flex-1 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
                {acceptMut.isPending ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
