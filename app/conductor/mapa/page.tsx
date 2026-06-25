'use client';

import { useState, useEffect, useRef } from 'react';
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
  name: string | null;
  shift: string | null;
  frequency: string | null;
  zone: { id: string; name: string };
  status: string;
  totalStops: number;
  completedStops: number;
  startedAt: string | null;
  createdAt: string;
  stops: RouteStop[];
}

type GpsStatus = 'idle' | 'active' | 'error';

const SHIFT_LABELS: Record<string, string> = {
  MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche', DOMINICAL: 'Dominical',
};

const STOP_ORDERED = '#154212';
const STOP_PENDING = '#2563eb';
const STOP_COMPLETED = '#16a34a';
const NAV_ROUTE_COLOR = '#f59e0b';
const MARKER_POLL_MS = 3_000;    // cada 3 s → marcador fluido
const BACKEND_SEND_MS = 10_000;  // cada 10 s → envío al backend
const ARRIVAL_THRESHOLD_M = 50;  // metros → nav desaparece al llegar aquí

/** Distancia en metros entre dos coordenadas (fórmula de Haversine) */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DriverMap() {
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainRouteLines, setMainRouteLines] = useState<MapRoute[]>([]);
  const [navRoute, setNavRoute] = useState<MapRoute | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [driverMarker, setDriverMarker] = useState<MapMarker | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const activeRouteIdRef = useRef<string | null>(null);

  // Refs para la lógica de nav — accesibles dentro de watchPosition sin stale closures
  const firstStopRef = useRef<RouteStop | null>(null);
  const arrivedAtStartRef = useRef(false);

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

  // Actualizar primera parada y resetear estado de llegada cuando cambia la ruta
  useEffect(() => {
    const sorted = activeRoute?.stops.slice().sort((a, b) => a.orderIndex - b.orderIndex) ?? [];
    firstStopRef.current = sorted[0] ?? null;
    arrivedAtStartRef.current = false;
    setNavRoute(null);
  }, [activeRoute?.id]);

  // Trazar la ruta principal (verde) entre las paradas
  useEffect(() => {
    if (!activeRoute || activeRoute.stops.length < 2) return;

    const waypoints = activeRoute.stops
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        lng: s.pickupPoint.longitude,
        lat: s.pickupPoint.latitude,
        label: s.pickupPoint.name,
      }));

    calculateRoute(waypoints).then((result) => {
      if (result) {
        setMainRouteLines([{ id: activeRoute.id, points: result.coordinates, color: '#154212' }]);
      }
    });
  }, [activeRoute]);

  // GPS: watchPosition para actualizar el marcador en tiempo real +
  //      setInterval cada 10 s para enviar al backend y recalcular nav
  useEffect(() => {
    const isActive = activeRoute?.status === 'IN_PROGRESS' || activeRoute?.status === 'PENDING';

    const stop = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (tickIntervalRef.current !== null) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };

    if (!activeRoute || !isActive) {
      stop();
      setGpsStatus('idle');
      setDriverMarker(null);
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      setGpsError('GPS no disponible en este dispositivo');
      return;
    }

    const onError = () => {
      setGpsStatus('error');
      setGpsError('No se pudo obtener la ubicación GPS');
    };

    // watchPosition → actualización fluida del marcador del conductor
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

        // Verificar llegada al punto inicial en cada update
        const firstStop = firstStopRef.current;
        if (firstStop && !arrivedAtStartRef.current) {
          const dist = haversineDistance(
            latitude, longitude,
            firstStop.pickupPoint.latitude,
            firstStop.pickupPoint.longitude,
          );
          if (dist <= ARRIVAL_THRESHOLD_M) {
            arrivedAtStartRef.current = true;
            setNavRoute(null);
          }
        }
      },
      onError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );

    // Tick cada 10 s → enviar al backend + recalcular ruta de navegación
    const tick = () => {
      const pos = lastPositionRef.current;
      if (!pos) return;
      const { latitude, longitude } = pos;

      // Enviar al backend solo si IN_PROGRESS
      if (activeRouteIdRef.current && activeRoute.status === 'IN_PROGRESS') {
        void api.post(`/routes/${activeRouteIdRef.current}/location`, {
          latitude,
          longitude,
        }).catch(() => {});
      }

      // Recalcular ruta de nav si aún no llegó al inicio
      const firstStop = firstStopRef.current;
      if (!firstStop || arrivedAtStartRef.current) return;

      calculateRoute([
        { lng: longitude, lat: latitude, label: 'Mi posición' },
        {
          lng: firstStop.pickupPoint.longitude,
          lat: firstStop.pickupPoint.latitude,
          label: firstStop.pickupPoint.name,
        },
      ]).then((result) => {
        if (result && !arrivedAtStartRef.current) {
          setNavRoute({ id: 'nav-to-start', points: result.coordinates, color: NAV_ROUTE_COLOR });
        }
      });
    };

    // Primera ejecución inmediata del tick
    tick();
    tickIntervalRef.current = setInterval(tick, BACKEND_SEND_MS);

    return stop;
  }, [activeRoute]);

  const markers: MapMarker[] = [
    ...(activeRoute
      ? activeRoute.stops
          .slice()
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

  const allRoutes: MapRoute[] = [
    ...mainRouteLines,
    ...(navRoute ? [navRoute] : []),
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
            {activeRoute.name ?? activeRoute.zone?.name ?? 'Sin zona'}
          </h2>
          <p className="text-[12px] text-on-surface-variant">
            {activeRoute.zone?.name}
            {activeRoute.shift ? ` · ${SHIFT_LABELS[activeRoute.shift] ?? activeRoute.shift}` : ''}
            {activeRoute.frequency ? ` · ${activeRoute.frequency}` : ''}
          </p>
          <p className="text-[12px] text-on-surface-variant">
            {activeRoute.completedStops}/{activeRoute.totalStops} paradas completadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* GPS status */}
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

      {/* Aviso navegación al inicio */}
      {navRoute && (
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#f59e0b] text-sm">navigation</span>
          <p className="text-[12px] font-bold text-[#b45309]">
            Dirígete al punto inicial de la ruta
          </p>
        </div>
      )}

      {gpsError && (
        <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-status-alert text-sm">gps_off</span>
          <p className="text-status-alert text-[12px]">{gpsError}</p>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-outline-variant/20">
        <MapView
          markers={markers}
          routes={allRoutes}
          height="400px"
          followMarkerId={driverMarker ? '__driver__' : undefined}
        />
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-[12px] text-on-surface-variant">
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
        {navRoute && (
          <div className="flex items-center gap-1">
            <span className="w-6 h-0.5 bg-[#f59e0b]" />
            Ir al inicio
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-[14px] font-bold text-on-surface-variant uppercase tracking-[0.08em]">
          Paradas
        </h3>
        {activeRoute.stops
          .slice()
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
