'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import MapView, { type MapMarker } from '@/components/map-view';
import type { PickupPoint } from '@/lib/types';

const CUSCO_CENTER: [number, number] = [-71.9675, -13.5320];

export default function MapaPage() {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);

  useEffect(() => {
    api.get<PickupPoint[]>('/pickup-points')
      .then(setPickupPoints)
      .catch(() => {});
  }, []);

  const markers: MapMarker[] = [
    {
      id: 'home',
      lng: CUSCO_CENTER[0],
      lat: CUSCO_CENTER[1],
      color: '#154212',
      icon: 'home',
      label: 'Mi Hogar',
    },
    {
      id: 'truck',
      lng: -71.9744,
      lat: -13.5210,
      color: '#C62828',
      icon: 'local_shipping',
      label: 'Camión en ruta',
    },
    ...pickupPoints.map((pp) => ({
      id: pp.id,
      lng: pp.longitude,
      lat: pp.latitude,
      color: '#2d5a27',
      icon: 'delete' as const,
      label: pp.name,
      description: pp.address,
    })),
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center w-full px-5 py-2 bg-surface shadow-sm shadow-primary/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="text-primary active:scale-95 transition-transform duration-200">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-[20px] leading-[28px] font-black text-primary">
            Eco Track Cusco
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-surface-container-high overflow-hidden shadow-sm text-on-primary-container font-bold">
          <span className="material-symbols-outlined">person</span>
        </div>
      </header>

      <main className="flex-grow relative w-full min-h-[400px]">
        <MapView
          markers={markers}
          height="calc(100vh - 140px)"
          onMarkerClick={(m) => {
            const pp = pickupPoints.find((p) => p.id === m.id);
            if (pp) setSelectedPoint(pp);
          }}
        />
      </main>

      {selectedPoint && (
        <div className="absolute bottom-24 left-5 right-5 z-20">
          <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-outline-variant/20">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[16px] leading-[24px] font-bold text-on-surface">
                  {selectedPoint.name}
                </h3>
                <p className="text-[14px] leading-[20px] text-on-surface-variant">
                  {selectedPoint.address}
                </p>
                {selectedPoint.zone && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[11px] font-bold">
                    {selectedPoint.zone.name}
                  </span>
                )}
              </div>
              <button
                className="text-on-surface-variant hover:text-primary"
                onClick={() => setSelectedPoint(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-5 right-5 z-20">
        <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-outline-variant/20">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-[20px] leading-[28px] font-bold text-primary">
                Camión en camino
              </h2>
              <p className="text-[16px] leading-[24px] text-on-surface-variant mt-1">
                Llegada estimada{' '}
                <span className="font-bold text-primary">15 min</span>
              </p>
            </div>
            <div className="bg-waste-recyclable/10 text-waste-recyclable px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
              <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">Reciclable</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity">
              <span className="material-symbols-outlined">notifications_active</span>
              Notificar llegada
            </button>
            <button className="w-12 h-12 border border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant active:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
