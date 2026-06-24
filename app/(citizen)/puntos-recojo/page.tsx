'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queries } from '@/lib/queries';
import { PickupPointCard } from '@/components/pickup-point-card';
import { useGeolocation } from '@/hooks/use-geolocation';
import { formatDuration, formatDistance } from '@/lib/routing';

export default function PuntosRecojoPage() {
  const [selectedRoute, setSelectedRoute] = useState('');
  const geo = useGeolocation();

  const { data: routes = [] } = useQuery(queries.routes.public());
  const { data: points = [], isLoading } = useQuery(queries.pickupPoints.all(undefined, selectedRoute || undefined));

  const [nearestInfo, setNearestInfo] = useState<{ id: string; duration: number; distance: number } | null>(null);
  const [ranking, setRanking] = useState<Map<string, { duration: number; distance: number }>>(new Map());

  const dests = useMemo(() => {
    if (!geo.latitude || !geo.longitude || points.length === 0) return null;
    return {
      origin: { lng: geo.longitude, lat: geo.latitude },
      dests: points.map((p) => ({ lng: p.longitude, lat: p.latitude })),
    };
  }, [geo.latitude, geo.longitude, points]);

  useEffect(() => {
    if (!dests) return;
    let cancelled = false;

    const origin = dests.origin;
    const destinations = dests.dests;

    fetch(
      `https://router.project-osrm.org/table/v1/driving/${origin.lng},${origin.lat};${destinations.map((d) => `${d.lng},${d.lat}`).join(';')}?sources=0&annotations=duration,distance`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.durations?.[0]) return;

        const map = new Map<string, { duration: number; distance: number }>();
        let minDur = Infinity;
        let minId = '';

        data.durations[0].forEach((dur: number | null, i: number) => {
          const duration = dur ?? Infinity;
          const dist = data.distances?.[0]?.[i] ?? 0;
          const id = points[i].id;
          map.set(id, { duration, distance: dist });

          if (duration < minDur) {
            minDur = duration;
            minId = id;
          }
        });

        setRanking(map);
        if (minId) setNearestInfo({ id: minId, duration: minDur, distance: map.get(minId)?.distance ?? 0 });
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [dests]);

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-[24px] leading-[32px] font-extrabold text-primary mb-1">
          Puntos de Recojo
        </h1>
        <p className="text-[14px] leading-[20px] text-on-surface-variant mb-6">
          Encuentra los puntos de recolección cercanos a tu ubicación.
        </p>

        {geo.loading && (
          <div className="mb-4 px-4 py-3 bg-primary-container/30 rounded-xl text-[13px] font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">my_location</span>
            Detectando tu ubicación...
          </div>
        )}

        {geo.error && (
          <div className="mb-4 px-4 py-3 bg-status-alert/10 rounded-xl text-[13px] font-bold text-status-alert flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">location_off</span>
            Activa tu ubicación para ver el punto más cercano
          </div>
        )}

        {nearestInfo && !selectedRoute && (
          <div className="mb-4 px-4 py-3 bg-primary-container/20 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">near_me</span>
              <span className="text-[13px] font-bold">
                Punto más cercano: {points.find((p) => p.id === nearestInfo.id)?.name}
              </span>
            </div>
            <p className="text-[12px] text-on-surface-variant mt-1 ml-7">
              A {formatDistance(nearestInfo.distance)} ({formatDuration(nearestInfo.duration)})
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-2">
            Filtrar por ruta
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
          >
            <option value="">Todas las rutas</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
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
              No hay puntos de recojo disponibles para esta ruta
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {points.map((p) => {
              const info = selectedRoute ? null : ranking.get(p.id);
              const isNearest = nearestInfo?.id === p.id;
              return (
                <div key={p.id} className="relative">
                  {isNearest && !selectedRoute && (
                    <div className="absolute -top-2 -right-2 z-10 px-2 py-0.5 bg-primary text-on-primary rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md">
                      <span className="material-symbols-outlined text-[12px]">near_me</span>
                      Más cercano
                    </div>
                  )}
                  <PickupPointCard point={p} />
                  {info && (
                    <div className="px-4 pb-3 pt-0 flex items-center gap-3 text-[11px] text-on-surface-variant font-bold bg-surface-card rounded-b-xl">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">directions_walk</span>
                        {formatDistance(info.distance)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {formatDuration(info.duration)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

