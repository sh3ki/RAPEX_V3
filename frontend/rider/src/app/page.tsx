'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Power, Bike, DollarSign, Wallet, MapPin, Bell } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function RiderHomePage() {
  const qc = useQueryClient();
  const [ping, setPing] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);

  // Dashboard stats
  const { data: dash } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: async () => { const { data } = await api.get('/rider/dashboard/'); return data; },
    refetchInterval: 10_000,
  });

  // Active order
  const { data: activeOrder } = useQuery({
    queryKey: ['active-order'],
    queryFn: async () => {
      try { const { data } = await api.get('/rider/orders/active/'); return data; }
      catch { return null; }
    },
    refetchInterval: 8_000,
  });

  const isOnline = dash?.is_online ?? false;

  // Toggle online/offline
  const toggleMut = useMutation({
    mutationFn: async () => { await api.patch('/rider/online/'); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-dashboard'] }),
  });

  // GPS location broadcasting
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

  // WebSocket for delivery pings
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
          setCountdown(180); // 3 min
        }
      };
    } catch {}
    return () => { ws?.close(); };
  }, [isOnline]);

  // Countdown timer for pings
  useEffect(() => {
    if (countdown <= 0) { if (ping) setPing(null); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, ping]);

  // Accept / Reject delivery
  const acceptMut = useMutation({
    mutationFn: async (orderId: string) => { await api.post(`/rider/orders/${orderId}/accept/`); },
    onSuccess: () => { setPing(null); setCountdown(0); qc.invalidateQueries({ queryKey: ['active-order'] }); },
  });
  const rejectMut = useMutation({
    mutationFn: async (orderId: string) => { await api.post(`/rider/orders/${orderId}/reject/`); },
    onSuccess: () => { setPing(null); setCountdown(0); },
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">RAPEX Rider</h1>
          <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>{isOnline ? '● Online' : '○ Offline'}</span>
        </div>
        <Link href="/notifications" className="p-2 rounded-lg bg-dark-surface border border-dark-border relative">
          <Bell size={18} />
        </Link>
      </div>

      {/* Go Online / Offline toggle */}
      <button
        onClick={() => toggleMut.mutate()}
        disabled={toggleMut.isPending}
        className={`w-full py-6 rounded-2xl font-bold text-lg flex flex-col items-center gap-2 transition-all ${isOnline ? 'bg-green-500/10 border-2 border-green-500/50 text-green-400' : 'bg-red-500/10 border-2 border-red-500/30 text-red-400'}`}
      >
        <Power size={40} />
        {toggleMut.isPending ? 'Updating…' : isOnline ? 'You are ONLINE' : 'Go ONLINE'}
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center !p-4">
          <Bike size={20} className="text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold">{dash?.deliveries_today || 0}</p>
          <p className="text-[10px] text-dark-muted">Deliveries</p>
        </div>
        <div className="card text-center !p-4">
          <DollarSign size={20} className="text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold">₦{parseFloat(dash?.earnings_today || '0').toLocaleString()}</p>
          <p className="text-[10px] text-dark-muted">Earnings</p>
        </div>
        <div className="card text-center !p-4">
          <Wallet size={20} className="text-primary-500 mx-auto mb-1" />
          <p className="text-lg font-bold">₦{parseFloat(dash?.wallet_balance || '0').toLocaleString()}</p>
          <p className="text-[10px] text-dark-muted">Wallet</p>
        </div>
      </div>

      {/* Active order */}
      {activeOrder && activeOrder.id && (
        <Link href={`/orders/${activeOrder.id}`} className="card border-primary-500/30 !p-4 space-y-2 block">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-primary-500 flex items-center gap-2"><MapPin size={14} /> Active Delivery</h2>
            <span className="badge-blue">{activeOrder.status}</span>
          </div>
          <p className="text-sm">Order #{(activeOrder.id || '').slice(0, 8)}</p>
          <p className="text-xs text-dark-muted">{activeOrder.delivery_address}</p>
          <p className="text-xs text-primary-500">Tap to view details →</p>
        </Link>
      )}

      {/* Delivery Ping */}
      {ping && (
        <div className="fixed inset-x-0 bottom-16 p-4 z-50">
          <div className="max-w-lg mx-auto card border-primary-500 !p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-primary-500 flex items-center gap-2"><Bike size={18} /> New Delivery Request!</h2>
              <span className="text-sm font-mono text-red-400">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
            </div>
            {ping.store_name && <p className="text-sm">From: <strong>{ping.store_name}</strong></p>}
            {ping.delivery_address && <p className="text-xs text-dark-muted">To: {ping.delivery_address}</p>}
            {ping.total && <p className="text-sm font-semibold">₦{parseFloat(ping.total).toLocaleString()}</p>}
            <div className="flex gap-3">
              <button onClick={() => rejectMut.mutate(ping.order_id || ping.id)} disabled={rejectMut.isPending} className="flex-1 py-3 rounded-lg border border-red-500/50 text-red-400 font-semibold hover:bg-red-500/10">
                Reject
              </button>
              <button onClick={() => acceptMut.mutate(ping.order_id || ping.id)} disabled={acceptMut.isPending} className="flex-1 btn-primary !py-3">
                {acceptMut.isPending ? 'Accepting…' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
