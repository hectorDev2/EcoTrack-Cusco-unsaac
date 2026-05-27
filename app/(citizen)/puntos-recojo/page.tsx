'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queries } from '@/lib/queries';
import { PickupPointCard } from '@/components/pickup-point-card';

export default function PuntosRecojoPage() {
  const [selectedZone, setSelectedZone] = useState('');

  const { data: zones = [] } = useQuery(queries.zones.all());
  const { data: points = [], isLoading } = useQuery(queries.pickupPoints.all(selectedZone || undefined));

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-[24px] leading-[32px] font-extrabold text-primary mb-1">
          Puntos de Recojo
        </h1>
        <p className="text-[14px] leading-[20px] text-on-surface-variant mb-6">
          Encontrá los puntos de recolección cercanos a tu zona.
        </p>

        <div className="mb-6">
          <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-2">
            Filtrar por zona
          </label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
          >
            <option value="">Todas las zonas</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : points.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-3xl text-outline block mb-2">location_off</span>
            <p className="text-on-surface-variant text-sm font-bold">
              No hay puntos de recojo disponibles
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {points.map((p) => (
              <PickupPointCard key={p.id} point={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
