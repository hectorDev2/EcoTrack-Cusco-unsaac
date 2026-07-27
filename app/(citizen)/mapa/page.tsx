'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queries } from '@/lib/queries';
import MapView, { type MapMarker, type MapRoute } from '@/components/map-view';
import type { PickupPoint, Incident, CollectionSchedule } from '@/lib/types';
import { useGeolocation } from '@/hooks/use-geolocation';
import { calculateRoute, formatDuration, nearestPointIndex } from '@/lib/routing';
import type { ActiveRoute } from '@/lib/types';

const CUSCO_CENTER: [number, number] = [-71.9675, -13.5320];
const MAX_PICKUP_MARKERS = 4;

function haversineKm(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DAY_LABELS: Record<string, string> = {
  MON: 'Lunes', TUE: 'Martes', WED: 'Miércoles', THU: 'Jueves',
  FRI: 'Viernes', SAT: 'Sábado', SUN: 'Domingo',
};

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const WASTE_COLORS: Record<string, string> = {
  ORGANICO: 'bg-waste-organic/10 text-waste-organic border-waste-organic/20',
  RECICLABLE: 'bg-waste-recyclable/10 text-waste-recyclable border-waste-recyclable/20',
  NO_RECICLABLE: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
  PELIGROSO: 'bg-status-alert/10 text-status-alert border-status-alert/20',
};

function SchedulesCard({ point, onClose }: { point: PickupPoint; onClose: () => void }) {
  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', point.zoneId],
    queryFn: async () => {
      const res = await api.get<{ data: CollectionSchedule[] }>(
        `/schedules?zoneId=${point.zoneId}&limit=50`,
      );
      return res.data;
    },
  });

  const grouped = schedules.reduce<Record<string, CollectionSchedule[]>>((acc, s) => {
    if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = [];
    acc[s.dayOfWeek].push(s);
    return acc;
  }, {});

  return (
    <div className="w-72 bg-surface-card rounded-xl shadow-2xl shadow-primary/20 border border-outline-variant/20 max-h-72 overflow-y-auto">
      <div className="p-4 border-b border-outline-variant/20">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] leading-[24px] font-bold text-on-surface">{point.name}</h3>
            <p className="text-[14px] leading-[20px] text-on-surface-variant truncate">{point.address}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {point.zone && (
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">
                  {point.zone.name}
                </span>
              )}
              {point.scheduledTime && (
                <span className="px-2 py-0.5 rounded-md bg-primary-container/30 text-primary text-[10px] font-bold">
                  {point.scheduledTime}
                </span>
              )}
              {point.frequency && (
                <span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[10px] font-bold uppercase">
                  {point.frequency.code}
                </span>
              )}
            </div>
          </div>
          <button className="text-on-surface-variant hover:text-primary ml-2" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
      {Object.keys(grouped).length > 0 && (
        <div className="p-4 space-y-3">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Horarios de recolección</p>
          {DAY_ORDER.filter((d) => grouped[d]).map((day) => (
            <div key={day}>
              <p className="text-[12px] font-bold text-on-surface mb-1">{DAY_LABELS[day] ?? day}</p>
              <div className="space-y-1.5">
                {grouped[day].map((s) => {
                  const colorClass = WASTE_COLORS[s.wasteType?.category ?? ''] ?? 'bg-surface-container-high text-on-surface-variant';
                  return (
                    <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClass}`}>
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate">{s.wasteType?.name ?? 'Residuo'}</p>
                        <p className="text-[10px] opacity-70">{s.startTime} - {s.endTime}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  CONTAINER_DAMAGED: 'Contenedor dañado',
  MISSED_COLLECTION: 'Recolección no realizada',
  ILLEGAL_DUMPING: 'Vertido ilegal',
  OTHER: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

export default function MapaPage() {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [nearestRoute, setNearestRoute] = useState<MapRoute | null>(null);
  const [nearestPoint, setNearestPoint] = useState<PickupPoint | null>(null);
  const [nearestDuration, setNearestDuration] = useState<number | null>(null);

  // Origen de la ruta: por defecto el centro de Cusco (ya no se prioriza la
  // ubicación GPS automáticamente). El usuario lo mueve arrastrando el marker,
  // haciendo click en el mapa, o con el botón "Usar mi ubicación".
  const [origin, setOrigin] = useState<{ lng: number; lat: number }>({
    lng: CUSCO_CENTER[0],
    lat: CUSCO_CENTER[1],
  });
  const [originIsMyLocation, setOriginIsMyLocation] = useState(false);

  // Fuerza un fitBounds explícito (origen + vertederos cercanos + ruta)
  // cada vez que se recalcula la ruta al más cercano.
  const [fitSignal, setFitSignal] = useState(0);
  const [fitRoutePoints, setFitRoutePoints] = useState<[number, number][] | undefined>(undefined);

  const geo = useGeolocation();
  const hasLocation = geo.latitude != null && geo.longitude != null;

  const useMyLocationAsOrigin = () => {
    if (!hasLocation) return;
    setOrigin({ lng: geo.longitude!, lat: geo.latitude! });
    setOriginIsMyLocation(true);
  };

  const { data: activeRoutes = [] } = useQuery({
    ...queries.routes.active(),
    refetchInterval: 15000,
  });

  const truckMarkers: MapMarker[] = activeRoutes
    .filter((r) => r.status === 'IN_PROGRESS' && r.currentLocation)
    .map((r) => ({
      id: `truck-${r.id}`,
      lng: r.currentLocation!.longitude,
      lat: r.currentLocation!.latitude,
      color: '#C62828',
      icon: 'local_shipping' as const,
      label: `${r.name ?? r.zone.name} · ${r.zone.name}`,
      description: 'Camión en ruta',
    }));

  // Trayecto (calles reales) de cada ruta en curso, calculado una sola vez
  // por ruta — se usa para "ocultar" el tramo ya recorrido a medida que se
  // van completando paradas, sin recalcular OSRM en cada poll.
  const [routePaths, setRoutePaths] = useState<
    Record<string, { coords: [number, number][]; stopIndices: number[] }>
  >({});

  useEffect(() => {
    const inProgress = activeRoutes.filter(
      (r): r is ActiveRoute => r.status === 'IN_PROGRESS' && r.stops.length >= 2,
    );
    for (const route of inProgress) {
      if (routePaths[route.id]) continue;
      const sorted = route.stops.slice().sort((a, b) => a.orderIndex - b.orderIndex);
      const waypoints = sorted.map((s) => ({ lng: s.pickupPoint.longitude, lat: s.pickupPoint.latitude }));
      calculateRoute(waypoints).then((result) => {
        if (!result) return;
        const stopIndices = sorted.map((s) =>
          nearestPointIndex(result.coordinates, { lng: s.pickupPoint.longitude, lat: s.pickupPoint.latitude }),
        );
        setRoutePaths((prev) => ({ ...prev, [route.id]: { coords: result.coordinates, stopIndices } }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo recalcular cuando cambian las rutas activas, no en cada render por routePaths
  }, [activeRoutes]);

  // Tramos restantes (se oculta el tramo hacia cualquier parada ya
  // COMPLETED) y markers de las paradas propias de cada ruta en curso.
  const truckRouteLines: MapRoute[] = [];
  const truckStopMarkers: MapMarker[] = [];
  for (const route of activeRoutes) {
    if (route.status !== 'IN_PROGRESS' || !route.currentLocation) continue;
    const sorted = route.stops.slice().sort((a, b) => a.orderIndex - b.orderIndex);
    const path = routePaths[route.id];

    if (path) {
      for (let i = 0; i < sorted.length - 1; i++) {
        const destStop = sorted[i + 1];
        if (destStop.status === 'COMPLETED') continue;
        const start = path.stopIndices[i];
        const end = path.stopIndices[i + 1];
        truckRouteLines.push({
          id: `truck-route-${route.id}-${i}`,
          points: path.coords.slice(start, end + 1),
          color: '#C62828',
        });
      }
    }

    sorted.forEach((s) => {
      const completed = s.status === 'COMPLETED';
      truckStopMarkers.push({
        id: `route-stop-${s.id}`,
        lng: s.pickupPoint.longitude,
        lat: s.pickupPoint.latitude,
        color: completed ? '#16a34a' : '#2563eb',
        icon: completed ? 'check_circle' : 'location_on',
        hideLabel: true,
      });
    });
  }

  useEffect(() => {
    api.get<PickupPoint[]>('/pickup-points')
      .then(setPickupPoints)
      .catch(() => {});
    api.get<Incident[]>('/incidents/my')
      .then(setIncidents)
      .catch(() => {});
  }, []);

  // Calculate nearest pickup point by road
  useEffect(() => {
    if (pickupPoints.length === 0) return;
    setNearestRoute(null);
    setNearestPoint(null);
    setNearestDuration(null);
    let cancelled = false;

    const destinations = pickupPoints.map((p) => ({ lng: p.longitude, lat: p.latitude }));
    const originStr = `${origin.lng},${origin.lat}`;
    const destStr = destinations.map((d) => `${d.lng},${d.lat}`).join(';');
    const destIndices = destinations.map((_, i) => i + 1).join(';');

    fetch(
      `https://router.project-osrm.org/table/v1/driving/${originStr};${destStr}?sources=0&destinations=${destIndices}&annotations=duration`,
    )
      .then((r) => r.json())
      .then((table) => {
        if (cancelled || !table.durations?.[0]) return;
        let minDur = Infinity;
        let minIdx = -1;

        table.durations[0].forEach((dur: number | null, i: number) => {
          const d = dur ?? Infinity;
          if (d < minDur) { minDur = d; minIdx = i; }
        });

        if (minIdx >= 0) {
          setNearestPoint(pickupPoints[minIdx]);
          setNearestDuration(minDur);

          // Draw route to nearest
          calculateRoute([
            { lng: origin.lng, lat: origin.lat },
            { lng: pickupPoints[minIdx].longitude, lat: pickupPoints[minIdx].latitude },
          ]).then((route) => {
            if (!cancelled && route) {
              setNearestRoute({
                id: 'nearest',
                points: route.coordinates,
                color: '#154212',
                label: `Ruta más cercana`,
              });
              // Centrar el mapa entre el origen, los vertederos cercanos y la ruta
              setFitRoutePoints(route.coordinates);
              setFitSignal((s) => s + 1);
            }
          });
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [origin.lng, origin.lat, pickupPoints]);

  const incidentMarkers: MapMarker[] = incidents
    .filter((inc) => inc.latitude != null && inc.longitude != null)
    .map((inc) => ({
      id: `inc-${inc.id}`,
      lng: inc.longitude!,
      lat: inc.latitude!,
      color: '#C62828',
      icon: 'report_problem' as const,
      label: TYPE_LABELS[inc.type] ?? inc.type,
      description: inc.address ?? '',
    }));

  // Varios registros de PickupPoint comparten la misma ubicación física
  // (un turno/horario distinto cada uno). Se agrupan por coordenada para
  // no mostrar el mismo vertedero repetido entre los "más cercanos".
  const nearestPickupPoints = useMemo(() => {
    if (pickupPoints.length === 0) return [];
    const seenLocations = new Set<string>();
    return pickupPoints
      .map((pp) => ({ ...pp, dist: haversineKm(origin.lng, origin.lat, pp.longitude, pp.latitude) }))
      .sort((a, b) => a.dist - b.dist)
      .filter((pp) => {
        const key = `${pp.latitude.toFixed(4)},${pp.longitude.toFixed(4)}`;
        if (seenLocations.has(key)) return false;
        seenLocations.add(key);
        return true;
      })
      .slice(0, MAX_PICKUP_MARKERS);
  }, [pickupPoints, origin.lng, origin.lat]);

  const originMarker: MapMarker = {
    id: 'origin',
    lng: origin.lng,
    lat: origin.lat,
    color: originIsMyLocation ? '#154212' : '#E8A317',
    icon: originIsMyLocation ? 'home' as const : 'location_on' as const,
    label: originIsMyLocation
      ? 'Mi Ubicación (arrastra para mover)'
      : 'Origen de ruta (arrastra para mover)',
    draggable: true,
  };

  const markers: MapMarker[] = [
    originMarker,
    ...truckMarkers,
    ...truckStopMarkers,
    ...nearestPickupPoints.map((pp) => ({
      id: pp.id,
      lng: pp.longitude,
      lat: pp.latitude,
      color: nearestPoint?.id === pp.id ? '#8BC34A' : '#2d5a27',
      icon: 'delete' as const,
      label: pp.name + (nearestPoint?.id === pp.id ? ' 🏆 Más cercano' : ''),
      description: pp.address,
      hideLabel: true,
    })),
    ...incidentMarkers,
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center w-full px-5 py-2 bg-surface shadow-sm shadow-primary/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="text-primary active:scale-95 transition-transform duration-200">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-[20px] leading-[28px] font-black text-primary">
            Eco Track Wanchaq
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-surface-container-high overflow-hidden shadow-sm text-on-primary-container font-bold">
          <span className="material-symbols-outlined">person</span>
        </div>
      </header>

      <main className="flex-grow relative w-full min-h-[400px]">
        <MapView
          markers={markers}
          routes={[...truckRouteLines, ...(nearestRoute ? [nearestRoute] : [])]}
          height="calc(100vh - 140px)"
          activeMarkerId={selectedPoint?.id}
          tooltipContent={
            selectedPoint ? (
              <SchedulesCard point={selectedPoint} onClose={() => setSelectedPoint(null)} />
            ) : undefined
          }
          fitBoundsSignal={fitSignal}
          fitBoundsMarkerIds={['origin', ...nearestPickupPoints.map((p) => p.id)]}
          fitBoundsRoutePoints={fitRoutePoints}
          onMarkerClick={(m) => {
            if (m.id === 'origin') return;
            const pp = pickupPoints.find((p) => p.id === m.id);
            if (pp) { setSelectedPoint(pp); setSelectedIncident(null); return; }
            const inc = incidents.find((i) => `inc-${i.id}` === m.id);
            if (inc) { setSelectedIncident(inc); setSelectedPoint(null); return; }
          }}
          onMapClick={(lng, lat) => {
            setOrigin({ lng, lat });
            setOriginIsMyLocation(false);
          }}
          onMarkerDragEnd={(id, lng, lat) => {
            if (id === 'origin') {
              setOrigin({ lng, lat });
              setOriginIsMyLocation(false);
            }
          }}
        />
      </main>

      {selectedIncident && (
        <div className="absolute bottom-24 left-5 right-5 z-20">
          <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-status-alert/20">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-status-alert" />
                  <h3 className="text-[16px] leading-[24px] font-bold text-on-surface">
                    {TYPE_LABELS[selectedIncident.type] ?? selectedIncident.type}
                  </h3>
                </div>
                <p className="text-[13px] leading-[18px] text-on-surface-variant mt-1 line-clamp-2">
                  {selectedIncident.description}
                </p>
                {selectedIncident.address && (
                  <p className="text-[12px] text-on-surface-variant mt-1 truncate">
                    {selectedIncident.address}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-status-alert/10 text-status-alert">
                    {STATUS_LABELS[selectedIncident.status] ?? selectedIncident.status}
                  </span>
                  {selectedIncident.latitude != null && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                      {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
              <button
                className="text-on-surface-variant hover:text-primary ml-2"
                onClick={() => setSelectedIncident(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-36 left-5 right-5 z-20">
        <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-primary/30 space-y-2">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold text-on-surface">
                {originIsMyLocation ? 'Mi ubicación' : 'Origen de ruta'}
              </h3>
              <p className="text-[12px] text-on-surface-variant mt-0.5 font-mono">
                {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}
              </p>
            </div>
            {hasLocation && !originIsMyLocation && (
              <button
                onClick={useMyLocationAsOrigin}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-lg text-[11px] font-bold active:scale-95 transition-transform whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px]">my_location</span>
                Usar mi ubicación
              </button>
            )}
          </div>
          {nearestPoint && nearestDuration != null && (
            <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-lg">near_me</span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-primary truncate">
                  Punto más cercano: {nearestPoint.name}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {nearestPoint.address} — A {formatDuration(nearestDuration)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-5 right-5 z-20">
        <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-outline-variant/20 space-y-3">
          <div className="flex items-center gap-4 text-[11px] font-bold text-on-surface-variant flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#2d5a27]" />
              <span>Recojo</span>
            </div>
            {nearestPoint && (
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#8BC34A]" />
                <span>Más cercano</span>
              </div>
            )}
            {truckMarkers.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#C62828]" />
                <span>Camión en ruta</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#C62828]" />
              <span>Incidencia</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: originIsMyLocation ? '#154212' : '#E8A317' }}
              />
              <span>{originIsMyLocation ? 'Mi ubicación' : 'Origen de ruta'}</span>
            </div>
          </div>

          {incidentMarkers.length > 0 && (
            <div className="flex items-center gap-2 text-[12px] text-on-surface-variant border-t border-outline-variant/20 pt-3">
              <span className="material-symbols-outlined text-status-alert text-sm">warning</span>
              <span className="font-bold">{incidentMarkers.length}</span>
              <span>incidencia{incidentMarkers.length !== 1 ? 's' : ''} reportada{incidentMarkers.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
