'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { calculateRoute, nearestForwardPointIndex } from '@/lib/routing';
import MapView, { type MapMarker, type MapRoute } from '@/components/map-view';

interface RouteStop {
  id: string;
  orderIndex: number;
  status: string;
  pickupPoint: { id: string; name: string; address: string; latitude: number; longitude: number };
}

interface AdminDriverRoute {
  id: string;
  name: string | null;
  shift: string | null;
  zone: { id: string; name: string };
  driver: { id: string; fullName: string } | null;
  status: string;
  totalStops: number;
  completedStops: number;
  stops: RouteStop[];
  currentLocation: { latitude: number; longitude: number; recordedAt: string } | null;
}

const SHIFT_LABELS: Record<string, string> = {
  MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche', DOMINICAL: 'Dominical',
};

const STOP_ORDERED = '#154212';
const STOP_PENDING = '#2563eb';
const STOP_COMPLETED = '#16a34a';
const ROUTE_POLL_MS = 4_000;

export default function VehicleRouteMapModal({
  driverId,
  plate,
  onClose,
}: {
  driverId: string;
  plate: string;
  onClose: () => void;
}) {
  const [route, setRoute] = useState<AdminDriverRoute | null | undefined>(undefined); // undefined = cargando
  const [error, setError] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<{ coords: [number, number][] } | null>(null);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [traveledIndex, setTraveledIndex] = useState<number | null>(null);

  // Ruta activa (o pendiente, como respaldo) del conductor de este vehículo.
  useEffect(() => {
    let cancelled = false;
    const fetchRoute = () => {
      api.get<AdminDriverRoute[]>('/routes')
        .then((routes) => {
          if (cancelled) return;
          const forDriver = routes.filter((r) => r.driver?.id === driverId);
          const active = forDriver.find((r) => r.status === 'IN_PROGRESS')
            ?? forDriver.find((r) => r.status === 'PENDING')
            ?? null;
          setRoute(active);
        })
        .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar la ruta'); });
    };
    fetchRoute();
    const interval = setInterval(fetchRoute, ROUTE_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [driverId]);

  useEffect(() => {
    api.get<{ enabled: boolean }>('/demo/enabled')
      .then((res) => setDemoEnabled(res.enabled))
      .catch(() => setDemoEnabled(false));
  }, []);

  // Trazar el trayecto por calles reales — una sola vez por ruta.
  useEffect(() => {
    if (!route || route.stops.length < 2) { setRoutePath(null); return; }
    const sorted = route.stops.slice().sort((a, b) => a.orderIndex - b.orderIndex);
    const waypoints = sorted.map((s) => ({
      lng: s.pickupPoint.longitude,
      lat: s.pickupPoint.latitude,
      label: s.pickupPoint.name,
    }));
    calculateRoute(waypoints).then((result) => { if (result) setRoutePath({ coords: result.coordinates }); });
    setTraveledIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo recalcular al cambiar de ruta
  }, [route?.id]);

  // Saber si hay una demo corriendo para esta ruta específica.
  useEffect(() => {
    if (!demoEnabled || !route || route.status !== 'IN_PROGRESS') { setDemoRunning(false); return; }
    let cancelled = false;
    const check = () => {
      api.get<{ running: boolean }>(`/demo/routes/${route.id}/status`)
        .then((res) => { if (!cancelled) setDemoRunning(res.running); })
        .catch(() => { if (!cancelled) setDemoRunning(false); });
    };
    check();
    const interval = setInterval(check, 3000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo recomprobar al cambiar de ruta/estado, no en cada poll
  }, [demoEnabled, route?.id, route?.status]);

  const truckLat = route?.currentLocation?.latitude;
  const truckLng = route?.currentLocation?.longitude;
  useEffect(() => {
    if (!routePath || truckLat == null || truckLng == null) return;
    setTraveledIndex((prev) =>
      nearestForwardPointIndex(routePath.coords, { lng: truckLng, lat: truckLat }, prev ?? 0),
    );
  }, [routePath, truckLat, truckLng]);

  const mainRouteLines: MapRoute[] = [];
  if (route && routePath) {
    const idx = route.currentLocation ? traveledIndex : null;
    const traveled = idx != null ? routePath.coords.slice(0, idx + 1) : [];
    const remaining = idx != null ? routePath.coords.slice(idx) : routePath.coords;
    if (traveled.length >= 2) mainRouteLines.push({ id: `${route.id}-traveled`, points: traveled, color: '#9aa0a6', dashed: true });
    if (remaining.length >= 2) mainRouteLines.push({ id: `${route.id}-remaining`, points: remaining, color: '#154212' });
  }

  const markers: MapMarker[] = [
    ...(route
      ? route.stops.slice().sort((a, b) => a.orderIndex - b.orderIndex).map((s) => {
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
      : []),
    ...(route?.currentLocation
      ? [{
          id: '__truck__',
          lat: route.currentLocation.latitude,
          lng: route.currentLocation.longitude,
          color: '#f59e0b',
          icon: 'local_shipping' as const,
          label: demoRunning ? '🎬 Camión (simulación)' : 'Camión',
          moveDurationMs: ROUTE_POLL_MS - 500,
          pathCoords: routePath?.coords,
        }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface-card rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <div>
            <h3 className="text-[18px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
              {plate}
            </h3>
            {route ? (
              <p className="text-[13px] text-on-surface-variant">
                {route.name ?? route.zone?.name ?? 'Ruta'}
                {route.shift ? ` · ${SHIFT_LABELS[route.shift] ?? route.shift}` : ''}
                {' · '}{route.completedStops}/{route.totalStops} paradas
              </p>
            ) : (
              <p className="text-[13px] text-on-surface-variant">Sin ruta en curso</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {demoRunning && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-[14px]">movie</span>
                Simulación en curso
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="relative h-[450px]">
          {route === undefined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute top-4 left-4 right-4 z-10 bg-status-alert/10 border border-status-alert/30 rounded-xl p-3">
              <p className="text-status-alert text-[12px] font-bold">{error}</p>
            </div>
          )}
          {route === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">route</span>
              <p className="text-on-surface font-bold text-sm">Este conductor no tiene una ruta en curso</p>
              <p className="text-on-surface-variant text-[12px] mt-1">El mapa se activa apenas inicie una ruta o una demo.</p>
            </div>
          )}
          {route && (
            <MapView
              markers={markers}
              routes={mainRouteLines}
              followMarkerId={route.currentLocation ? '__truck__' : undefined}
            />
          )}
        </div>

        {route && route.stops.length > 0 && (
          <div className="p-4 border-t border-outline-variant/20 max-h-40 overflow-y-auto">
            <div className="flex gap-2 flex-wrap">
              {route.stops.slice().sort((a, b) => a.orderIndex - b.orderIndex).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 text-[12px]">
                  <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 ${
                    s.status === 'COMPLETED' ? 'bg-waste-organic/10 text-waste-organic' : 'bg-primary/10 text-primary'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-bold text-on-surface">{s.pickupPoint.address || s.pickupPoint.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
