'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

type GpsStatus = 'idle' | 'active' | 'error';

const STOP_ORDERED = '#154212';
const STOP_PENDING = '#2563eb';
const STOP_COMPLETED = '#16a34a';
const GPS_INTERVAL_MS = 10_000;

export default function DriverMap() {
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapRoutes, setMapRoutes] = useState<MapRoute[]>([]);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [driverMarker, setDriverMarker] = useState<MapMarker | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const activeRouteIdRef = useRef<string | null>(null);

  useEffect(() => {
    api.get<DriverRoute[]>('/routes/my')
      .then(setRoutes)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error al cargar rutas'))
      .finally(() => setLoading(false));
  }, []);

  const activeRoute = routes.find((r) => r.status === 'IN_PROGRESS')
    ?? routes.find((r) => r.status === 'PENDING');

  useEffect(() => {
    activeRouteIdRef.current = activeRoute?.id ?? null;
  }, [activeRoute]);

  // Calculate route polyline
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

  // Send location to backend
  const sendLocation = useCallback(async () => {
    const pos = lastPositionRef.current;
    const routeId = activeRouteIdRef.current;
    if (!pos || !routeId) return;

    try {
      await api.post(`/routes/${routeId}/location`, {
        latitude: pos.latitude,
        longitude: pos.longitude,
      });
    } catch {
      // Silent — GPS indicator stays active, don't interrupt driver
    }
  }, []);

  // Start/stop GPS tracking based on active route status
  useEffect(() => {
    if (!activeRoute || activeRoute.status !== 'IN_PROGRESS') {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (sendIntervalRef.current !== null) {
        clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;
      }
      setGpsStatus('idle');
      setDriverMarker(null);
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      setGpsError('GPS no disponible en este dispositivo');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        lastPositionRef.current = { latitude, longitude };
        setGpsStatus('active');
        setGpsError(null);
        setDriverMarker({
          id: '__driver__',
          lat: latitude,
          lng: longitude,
          color: '#f59e0b',
          icon: 'local_shipping',
          label: 'Mi posición',
        });
      },
      (_err) => {
        setGpsStatus('error');
        setGpsError('No se pudo obtener la ubicación GPS');
      },
      { enableHighAccuracy: true, maximumAge: 5_000 },
    );

    // Send position every GPS_INTERVAL_MS
    sendIntervalRef.current = setInterval(() => {
      void sendLocation();
    }, GPS_INTERVAL_MS);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (sendIntervalRef.current !== null) {
        clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;
      }
    };
  }, [activeRoute, sendLocation]);

  const markers: MapMarker[] = [
    ...(activeRoute
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
      : []),
    ...(driverMarker ? [driverMarker] : []),
  ];

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
        <div className="flex items-center gap-2">
          {/* GPS status indicator */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold ${
            gpsStatus === 'active'
              ? 'bg-waste-organic/10 text-waste-organic'
              : gpsStatus === 'error'
                ? 'bg-status-alert/10 text-status-alert'
                : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              gpsStatus === 'active'
                ? 'bg-waste-organic animate-pulse'
                : gpsStatus === 'error'
                  ? 'bg-status-alert'
                  : 'bg-outline'
            }`} />
            {gpsStatus === 'active' ? 'GPS activo' : gpsStatus === 'error' ? 'Sin GPS' : 'GPS inactivo'}
          </div>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
            activeRoute.status === 'IN_PROGRESS'
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            {activeRoute.status === 'IN_PROGRESS' ? 'En curso' : 'Pendiente'}
          </span>
        </div>
      </div>

      {gpsError && (
        <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-status-alert text-sm">gps_off</span>
          <p className="text-status-alert text-[12px]">{gpsError}</p>
        </div>
      )}

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
        {driverMarker && (
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            Mi posición
          </div>
        )}
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
