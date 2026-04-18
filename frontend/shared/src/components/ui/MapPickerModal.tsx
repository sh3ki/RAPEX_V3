'use client';

import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

declare global {
  interface Window {
    L?: any;
  }
}

interface MapPickerModalProps {
  open: boolean;
  onClose: () => void;
  latitude: string;
  longitude: string;
  onSave: (latitude: string, longitude: string) => void;
  title?: string;
  provider?: 'leaflet' | 'manual';
}

export function MapPickerModal({
  open,
  onClose,
  latitude,
  longitude,
  onSave,
  title = 'Choose Business Location',
  provider = 'leaflet',
}: MapPickerModalProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedLat, setSelectedLat] = useState(latitude);
  const [selectedLng, setSelectedLng] = useState(longitude);

  useEffect(() => {
    setSelectedLat(latitude);
    setSelectedLng(longitude);
  }, [latitude, longitude]);

  useEffect(() => {
    if (!open || provider !== 'leaflet') {
      return;
    }

    const setupMap = () => {
      if (!window.L || !mapRef.current || instanceRef.current) {
        return;
      }

      const lat = Number(selectedLat || '14.5995');
      const lng = Number(selectedLng || '120.9842');
      const map = window.L.map(mapRef.current).setView([lat, lng], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markerRef.current = window.L.marker([lat, lng]).addTo(map);
      map.on('click', (event: any) => {
        const { lat: newLat, lng: newLng } = event.latlng;
        markerRef.current.setLatLng([newLat, newLng]);
        setSelectedLat(String(newLat));
        setSelectedLng(String(newLng));
      });

      instanceRef.current = map;
    };

    if (!window.L) {
      const cssId = 'leaflet-css';
      const jsId = 'leaflet-js';

      if (!document.getElementById(cssId)) {
        const css = document.createElement('link');
        css.id = cssId;
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      if (!document.getElementById(jsId)) {
        const script = document.createElement('script');
        script.id = jsId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = setupMap;
        document.body.appendChild(script);
      } else {
        setupMap();
      }
    } else {
      setupMap();
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, provider, selectedLat, selectedLng]);

  const useCurrentLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedLat(String(lat));
        setSelectedLng(String(lng));
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (instanceRef.current) {
          instanceRef.current.setView([lat, lng], 15);
        }
      },
      () => undefined,
    );
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-primary-600" />
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-3 p-5">
          {provider === 'leaflet' ? (
            <>
              <div ref={mapRef} className="h-[360px] w-full rounded-xl border border-slate-300" />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" onClick={useCurrentLocation}>
                  Use Current Location
                </Button>
                <div className="text-xs text-slate-600">
                  Lat: {selectedLat || '-'} | Lng: {selectedLng || '-'}
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Latitude" value={selectedLat} onChange={(event) => setSelectedLat(event.target.value)} />
              <Input label="Longitude" value={selectedLng} onChange={(event) => setSelectedLng(event.target.value)} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(selectedLat, selectedLng);
              onClose();
            }}
          >
            Save Coordinates
          </Button>
        </div>
      </div>
    </div>
  );
}
