'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect } from 'react';
import { MapPin, Store, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const storeTypes = ['ALL', 'SHOP', 'FRESH_MARKET', 'READY_TO_EAT', 'PRELOVED'] as const;
const typeLabels: Record<string, string> = { SHOP: 'Shop', FRESH_MARKET: 'Fresh Market', READY_TO_EAT: 'Ready to Eat', PRELOVED: 'Preloved', ALL: 'All' };

export default function HomePage() {
  const [type, setType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 6.5244, lng: 3.3792 })
      );
    } else { setCoords({ lat: 6.5244, lng: 3.3792 }); }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['nearby-merchants', coords, type],
    queryFn: async () => {
      if (!coords) return [];
      const params: Record<string, string | number> = { lat: coords.lat, lng: coords.lng, radius: 10 };
      if (type !== 'ALL') params.type = type;
      const { data } = await api.get('/user/merchants/', { params });
      return data?.results || data || [];
    },
    enabled: !!coords,
  });

  const stores = (data || []).filter((s: any) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nearby Stores</h1>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
              <MapPin size={12} />
              <span>{coords ? `${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}` : 'Locating...'}</span>
            </div>
          </div>
          <Link href="/referral" className="text-primary-500 text-xs font-medium border border-primary-300 rounded-full px-3 py-1.5 hover:bg-primary-50 transition-colors">Refer & Earn</Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all" placeholder="Search stores..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {storeTypes.map(t => (
          <button key={t} onClick={() => setType(t)} className={`whitespace-nowrap text-xs font-medium px-4 py-2 rounded-full transition-colors ${type === t ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
            {typeLabels[t]}
          </button>
        ))}
      </div>

      {/* Store list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white border border-gray-200 rounded-xl h-20 animate-pulse" />)}</div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Store size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No stores found nearby</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((s: any) => (
            <Link key={s.id} href={`/stores/${s.id}`} className="card flex items-center gap-4 hover:shadow-md hover:border-primary-200 transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Store size={24} className="text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{s.name}</h3>
                <p className="text-xs text-gray-500 truncate">{s.address || typeLabels[s.store_type] || s.store_type}</p>
                <span className={`text-[10px] font-medium ${s.is_open ? 'text-emerald-500' : 'text-red-500'}`}>{s.is_open ? 'Open' : 'Closed'}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
