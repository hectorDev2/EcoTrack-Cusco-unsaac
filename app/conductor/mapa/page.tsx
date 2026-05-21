'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { calculateRoute } from '@/lib/routing';
import MapView, { type MapMarker, type MapRoute } from '@/components/map-view';

interface RouteStop {
  id: string;
  orderIndex: number;
  status: string;
  pickupPoint: { id: string; name: string; address: string; latitude: number; longitude: number };
}

interface DriverRoute {
  id: string;
  zone: { id: string; name: string };
  status: string;
  totalStops: number;
  completedStops: number;
  startedAt: string | null;
  createdAt: string;
  stops: RouteStop[];
}

const STOP_ORDERED = '#154212';
const STOP_PENDING = '#2563eb';
const STOP_COMPLETED = '#16a34a';

export default function DriverMap() {
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapRoutes, setMapRoutes] = useState<MapRoute[]>([]);

  useEffect(() => {
    api.get<DriverRoute[]>('/routes/my')
      .then(setRoutes)
      .catch((err) => setError(err.message ?? 'Error al cargar rutas'))
      .finally(() => setLoading(false));
  }, []);

  const activeRoute = routes.find((r) => r.status === 'IN_PROGRESS')
    ?? routes.find((r) => r.status === 'PENDING');

  useEffect(() => {
    if (!activeRoute || activeRoute.stops.length < 2) return;

    const waypoints = activeRoute.stops
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        lng: s.pickupPoint.longitude,
        lat: s.pickupPoint.latitude,
        label: s.pickupPoint.name,
      }));

    calculateRoute(waypoints).then((result) => {
      if (result) {
        setMapRoutes([{
          id: activeRoute.id,
          points: result.coordinates,
          color: '#154212',
        }]);
      }
    });
  }, [activeRoute]);

  const markers: MapMarker[] = activeRoute
    ? activeRoute.stops
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => {
          let color = STOP_ORDERED;
          if (s.status === 'PENDING') color = STOP_PENDING;
          if (s.status === 'COMPLETED') color = STOP_COMPLETED;
          return {
            id: s.id,
            lng: s.pickupPoint.longitude,
            lat: s.pickupPoint.latitude,
            color,
            icon: s.status === 'COMPLETED' ? 'check_circle' : 'location_on',
            label: `${s.pickupPoint.name} (#${s.orderIndex + 1})`,
            description: s.pickupPoint.address,
          };
        })
    : [];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-bold">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-status-alert text-sm">error</span>
        <p className="text-status-alert text-sm font-bold">{error}</p>
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="bg-surface-card rounded-2xl p-8 text-center border border-outline-variant/20">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">route</span>
        <h2 className="text-[20px] font-bold text-on-surface mb-2">Sin ruta activa</h2>
        <p className="text-on-surface-variant text-sm">No tienes una ruta en curso para mostrar en el mapa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-extrabold text-primary">
            {activeRoute.zone?.name ?? 'Sin zona'}
          </h2>
          <p className="text-[12px] text-on-surface-variant">
            {activeRoute.completedStops}/{activeRoute.totalStops} paradas completadas
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
          activeRoute.status === 'IN_PROGRESS'
            ? 'bg-primary/10 text-primary'
            : 'bg-surface-container-high text-on-surface-variant'
        }`}>
          {activeRoute.status === 'IN_PROGRESS' ? 'En curso' : 'Pendiente'}
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden border border-outline-variant/20">
        <MapView
          markers={markers}
          routes={mapRoutes}
          height="400px"
        />
      </div>

      <div className="flex items-center gap-4 text-[12px] text-on-surface-variant">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#2563eb]" />
          Pendiente
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#16a34a]" />
          Completada
        </div>
        {activeRoute.stops.length >= 2 && (
          <div className="flex items-center gap-1">
            <span className="w-6 h-0.5 bg-[#154212]" />
            Ruta
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-[14px] font-bold text-on-surface-variant uppercase tracking-[0.08em]">
          Paradas
        </h3>
        {activeRoute.stops
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((stop) => (
            <div
              key={stop.id}
              className={`bg-surface-card rounded-xl p-4 border flex items-center gap-4 ${
                stop.status === 'COMPLETED'
                  ? 'border-waste-organic/20 opacity-70'
                  : 'border-outline-variant/20'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                stop.status === 'COMPLETED'
                  ? 'bg-waste-organic/10 text-waste-organic'
                  : stop.status === 'PENDING'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-sm">
                  {stop.status === 'COMPLETED' ? 'check_circle' : 'location_on'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-on-surface truncate">{stop.pickupPoint.name}</p>
                <p className="text-[12px] text-on-surface-variant truncate">{stop.pickupPoint.address}</p>
              </div>
              <span className="text-[11px] font-bold text-outline">#{stop.orderIndex + 1}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
