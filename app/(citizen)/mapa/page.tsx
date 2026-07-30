'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { queries } from '@/lib/queries';
import MapView, { type MapMarker, type MapRoute } from '@/components/map-view';
import type { PickupPoint, Incident, CollectionSchedule } from '@/lib/types';
import { useGeolocation } from '@/hooks/use-geolocation';
import { calculateRoute, formatDuration, nearestForwardPointIndex } from '@/lib/routing';
import type { ActiveRoute } from '@/lib/types';
import { useRouteLive } from '@/lib/live';

const CUSCO_CENTER: [number, number] = [-71.9675, -13.5320];

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

// Contenedor/vertedero de la ruta más cercana que se muestra en el mapa.
interface RouteContainer {
  id: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  completed: boolean;
}

export default function MapaPage() {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [nearestRoute, setNearestRoute] = useState<MapRoute | null>(null);
  const [nearestPoint, setNearestPoint] = useState<RouteContainer | null>(null);
  const [nearestDuration, setNearestDuration] = useState<number | null>(null);

  // Origen de la ruta: por defecto el centro de Cusco (ya no se prioriza la
  // ubicación GPS automáticamente). El usuario lo mueve arrastrando el marker,
  // haciendo click en el mapa, o con el botón "Usar mi ubicación".
  const [origin, setOrigin] = useState<{ lng: number; lat: number }>({
    lng: CUSCO_CENTER[0],
    lat: CUSCO_CENTER[1],
  });
  const [originIsMyLocation, setOriginIsMyLocation] = useState(false);
  const [originIsHome, setOriginIsHome] = useState(false);

  const { user, refreshProfile } = useAuth();
  const [homeLoaded, setHomeLoaded] = useState(false);
  const [savingHome, setSavingHome] = useState(false);
  const [homeMsg, setHomeMsg] = useState<string | null>(null);

  // Carga inicial: si hay "Casa" guardada, se usa como origen (una sola vez —
  // después respetamos los movimientos manuales del usuario).
  useEffect(() => {
    if (homeLoaded || !user) return;
    if (user.homeLatitude != null && user.homeLongitude != null) {
      setOrigin({ lng: user.homeLongitude, lat: user.homeLatitude });
      setOriginIsHome(true);
      setOriginIsMyLocation(false);
    }
    setHomeLoaded(true);
  }, [user, homeLoaded]);

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
    setOriginIsHome(false);
  };

  // Guarda el origen actual como "Casa": reverse-geocode de la dirección +
  // PATCH /auth/me, y recarga el perfil para que persista al recargar.
  const saveAsHome = async () => {
    setSavingHome(true);
    setHomeMsg(null);
    try {
      let address = '';
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${origin.lat}&lon=${origin.lng}&addressdetails=1`,
          { headers: { 'User-Agent': 'EcoTrackCusco/1.0' } },
        );
        const data = await res.json();
        if (data?.display_name) address = data.display_name.split(',').slice(0, 3).join(',').trim();
      } catch {
        // sin dirección textual no es bloqueante — se guarda igual con coords
      }
      await api.patch('/auth/me', {
        homeLatitude: origin.lat,
        homeLongitude: origin.lng,
        homeAddress: address || undefined,
      });
      await refreshProfile();
      setOriginIsHome(true);
      setOriginIsMyLocation(false);
      setHomeMsg('Casa guardada');
      setTimeout(() => setHomeMsg((m) => (m === 'Casa guardada' ? null : m)), 2500);
    } catch (err) {
      setHomeMsg(err instanceof ApiClientError ? err.message : 'No se pudo guardar la casa');
    } finally {
      setSavingHome(false);
    }
  };

  // Polling más frecuente que antes (era 15s) para que, combinado con
  // moveDurationMs abajo, el camión se vea deslizarse en vez de saltar.
  const TRUCK_POLL_MS = 5000;

  const { data: activeRoutes = [] } = useQuery({
    ...queries.routes.active(),
    refetchInterval: TRUCK_POLL_MS,
  });

  // Stream en vivo (SSE) del camión en curso — el mismo que ven el conductor y
  // el admin, así el vecino lo mira moverse en simultáneo. Para la demo hay un
  // solo camión activo; se sigue esa ruta.
  // Entre las rutas en curso se elige SOLO la más cercana al origen (ubicación
  // del usuario / casa): su camión, trazado y paradas son lo único que se
  // muestra. Al mover el origen, la elección se recalcula.
  const closestRoute = useMemo(() => {
    const candidates = activeRoutes.filter((r) => r.stops.length > 0);
    let best: ActiveRoute | undefined;
    let bestDist = Infinity;
    for (const r of candidates) {
      let d = Infinity;
      for (const s of r.stops) {
        d = Math.min(
          d,
          haversineKm(origin.lng, origin.lat, s.pickupPoint.longitude, s.pickupPoint.latitude),
        );
      }
      if (d < bestDist) { bestDist = d; best = r; }
    }
    return best;
  }, [activeRoutes, origin.lng, origin.lat]);

  const nearestActiveRouteId = closestRoute?.id;
  // El camión en vivo solo tiene sentido si la ruta más cercana está EN CURSO.
  const liveRouteId = closestRoute?.status === 'IN_PROGRESS' ? closestRoute.id : undefined;
  const live = useRouteLive(liveRouteId, !!liveRouteId, user?.id);
  // Aviso anticipado "a N paradas de tu casa" — se descarta por marca temporal.
  const [alertDismissed, setAlertDismissed] = useState<number | null>(null);
  const showAlert = live.alert && live.alert.at !== alertDismissed;

  // Contenedores/vertederos de la ÚNICA ruta más cercana (no los globales).
  // Se agrupan por coordenada (varios PickupPoint comparten ubicación física,
  // un turno/horario cada uno) y se marca si el camión ya pasó por cada uno.
  const routeContainers = useMemo<RouteContainer[]>(() => {
    if (!closestRoute) return [];
    const seen = new Set<string>();
    const out: RouteContainer[] = [];
    const sorted = closestRoute.stops.slice().sort((a, b) => a.orderIndex - b.orderIndex);
    for (const s of sorted) {
      const key = `${s.pickupPoint.latitude.toFixed(4)},${s.pickupPoint.longitude.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: s.pickupPoint.id,
        name: s.pickupPoint.name,
        address: s.pickupPoint.address,
        longitude: s.pickupPoint.longitude,
        latitude: s.pickupPoint.latitude,
        completed: s.status === 'COMPLETED' || live.completedStopIds.has(s.id),
      });
    }
    return out;
  }, [closestRoute, live.completedStopIds]);
  const liveTruckFor = (routeId: string): { lat: number; lng: number } | null =>
    routeId === liveRouteId && live.position
      ? { lat: live.position.lat, lng: live.position.lng }
      : null;

  // Trayecto (calles reales) de cada ruta en curso, calculado una sola vez
  // por ruta — se usa para separar el tramo recorrido del que falta, sin
  // recalcular OSRM en cada poll.
  const [routePaths, setRoutePaths] = useState<Record<string, { coords: [number, number][] }>>({});

  useEffect(() => {
    // Trazado de la ruta más cercana, esté EN CURSO o PENDING — así su
    // recorrido se dibuja aunque todavía no haya camión.
    const toTrace = activeRoutes.filter(
      (r): r is ActiveRoute => r.stops.length >= 2 && r.id === nearestActiveRouteId,
    );
    for (const route of toTrace) {
      if (routePaths[route.id]) continue;
      const sorted = route.stops.slice().sort((a, b) => a.orderIndex - b.orderIndex);
      const waypoints = sorted.map((s) => ({ lng: s.pickupPoint.longitude, lat: s.pickupPoint.latitude }));
      calculateRoute(waypoints).then((result) => {
        if (!result) return;
        setRoutePaths((prev) => ({ ...prev, [route.id]: { coords: result.coordinates } }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcular al cambiar las rutas activas o la ruta más cercana elegida, no en cada render por routePaths
  }, [activeRoutes, nearestActiveRouteId]);

  // Índice (por ruta) hasta donde ya pasó el camión sobre `routePaths[id].coords`
  // — se usa para pintar el tramo recorrido como rastro discontinuo, separado
  // del tramo que falta. Solo avanza hacia adelante (ver nearestForwardPointIndex)
  // para no confundirse con un tramo anterior en una calle que se cruza consigo misma.
  const [traveledIndexByRoute, setTraveledIndexByRoute] = useState<Record<string, number>>({});

  useEffect(() => {
    setTraveledIndexByRoute((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const route of activeRoutes) {
        if (route.id !== nearestActiveRouteId) continue;
        const liveTruck = liveTruckFor(route.id);
        const truck = liveTruck
          ? { longitude: liveTruck.lng, latitude: liveTruck.lat }
          : route.currentLocation;
        if (!truck) continue;
        const path = routePaths[route.id];
        if (!path) continue;
        const idx = nearestForwardPointIndex(
          path.coords,
          { lng: truck.longitude, lat: truck.latitude },
          prev[route.id] ?? 0,
        );
        if (idx !== prev[route.id]) {
          next[route.id] = idx;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- live.position mueve el rastro en vivo
  }, [activeRoutes, routePaths, live.position, nearestActiveRouteId]);

  // Trayecto de la ruta más cercana. SIEMPRE se dibuja su recorrido (aunque no
  // haya camión: ruta PENDING). Si hay camión, se separa el tramo recorrido
  // (gris discontinuo) del restante (rojo) y se muestra el marker del camión.
  const truckRouteLines: MapRoute[] = [];
  const truckMarkers: MapMarker[] = [];
  if (closestRoute) {
    const path = routePaths[closestRoute.id];
    const liveTruck = liveTruckFor(closestRoute.id);
    const truck = liveTruck
      ? { longitude: liveTruck.lng, latitude: liveTruck.lat }
      : closestRoute.currentLocation;

    if (truck) {
      truckMarkers.push({
        id: `truck-${closestRoute.id}`,
        lng: truck.longitude,
        lat: truck.latitude,
        color: '#C62828',
        icon: 'local_shipping' as const,
        label: `${closestRoute.name ?? closestRoute.zone.name} · ${closestRoute.zone.name}`,
        description: 'Camión en ruta',
        // Con SSE llega ~1 posición/seg; se desliza en ese lapso (respaldo: poll).
        moveDurationMs: liveTruck ? 1100 : TRUCK_POLL_MS - 500,
        pathCoords: path?.coords,
      });
    }

    if (path) {
      // Sin camión: recorrido completo en verde (trayecto de la ruta).
      // Con camión: recorrido gris + restante rojo.
      const idx = truck ? traveledIndexByRoute[closestRoute.id] : undefined;
      const traveled = idx != null ? path.coords.slice(0, idx + 1) : [];
      const remaining = idx != null ? path.coords.slice(idx) : path.coords;
      if (traveled.length >= 2) {
        truckRouteLines.push({
          id: `route-${closestRoute.id}-traveled`,
          points: traveled,
          color: '#9aa0a6',
          dashed: true,
        });
      }
      if (remaining.length >= 2) {
        truckRouteLines.push({
          id: `route-${closestRoute.id}-remaining`,
          points: remaining,
          // Con camión: rojo (tramo restante). Sin camión: azul = recorrido de
          // la ruta a la que pertenecen estos contenedores.
          color: truck ? '#C62828' : '#2563eb',
        });
      }
    }
  }

  useEffect(() => {
    api.get<PickupPoint[]>('/pickup-points')
      .then(setPickupPoints)
      .catch(() => {});
    api.get<Incident[]>('/incidents/my')
      .then(setIncidents)
      .catch(() => {});
  }, []);

  // Punto de recojo más cercano por carretera — SOLO entre los contenedores de
  // la ruta más cercana (no entre todos los vertederos del distrito).
  useEffect(() => {
    if (routeContainers.length === 0) {
      setNearestRoute(null);
      setNearestPoint(null);
      setNearestDuration(null);
      return;
    }
    setNearestRoute(null);
    setNearestPoint(null);
    setNearestDuration(null);
    let cancelled = false;

    const destinations = routeContainers.map((p) => ({ lng: p.longitude, lat: p.latitude }));
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
          setNearestPoint(routeContainers[minIdx]);
          setNearestDuration(minDur);

          // Draw route to nearest
          calculateRoute([
            { lng: origin.lng, lat: origin.lat },
            { lng: routeContainers[minIdx].longitude, lat: routeContainers[minIdx].latitude },
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
  }, [origin.lng, origin.lat, routeContainers]);

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

  const originMarker: MapMarker = {
    id: 'origin',
    lng: origin.lng,
    lat: origin.lat,
    color: originIsHome ? '#154212' : originIsMyLocation ? '#2563eb' : '#E8A317',
    icon: originIsHome ? 'home' as const : originIsMyLocation ? 'my_location' as const : 'location_on' as const,
    label: originIsHome
      ? 'Casa (arrastra para mover)'
      : originIsMyLocation
        ? 'Mi Ubicación (arrastra para mover)'
        : 'Origen de ruta (arrastra para mover)',
    draggable: true,
  };

  const markers: MapMarker[] = [
    originMarker,
    ...truckMarkers,
    ...routeContainers.map((pp) => {
      const isNearest = nearestPoint?.id === pp.id;
      return {
        id: pp.id,
        lng: pp.longitude,
        lat: pp.latitude,
        color: pp.completed ? '#16a34a' : isNearest ? '#8BC34A' : '#2d5a27',
        icon: pp.completed ? 'check_circle' : 'delete',
        label: pp.name + (isNearest ? ' 🏆 Más cercano' : ''),
        description: pp.address,
        hideLabel: true,
      };
    }),
    ...incidentMarkers,
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center w-full px-5 py-2 bg-surface shadow-sm shadow-primary/10 sticky top-0 z-50">
        <h1 className="text-[20px] leading-[28px] font-black text-primary">
          Eco Track Wanchaq
        </h1>
      </header>

      <main className="flex-grow relative w-full min-h-[400px]">
        {showAlert && live.alert && (
          <div className="absolute top-4 left-4 right-4 z-30">
            <div className="bg-primary text-on-primary rounded-xl p-4 shadow-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[28px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold leading-tight">
                  ¡El camión está a {live.alert.stopsAway} parada{live.alert.stopsAway === 1 ? '' : 's'} de tu casa!
                </p>
                <p className="text-[12px] opacity-90 truncate">
                  Punto más cercano: {live.alert.name}. Prepárate para sacar tus residuos.
                </p>
              </div>
              <button
                onClick={() => setAlertDismissed(live.alert!.at)}
                className="p-1 rounded-full hover:bg-black/10 flex-shrink-0"
                aria-label="Descartar aviso"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        )}
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
          fitBoundsMarkerIds={['origin', ...routeContainers.map((p) => p.id)]}
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
            setOriginIsHome(false);
          }}
          onMarkerDragEnd={(id, lng, lat) => {
            if (id === 'origin') {
              setOrigin({ lng, lat });
              setOriginIsMyLocation(false);
              setOriginIsHome(false);
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
              <h3 className="text-[14px] font-bold text-on-surface flex items-center gap-1.5">
                {originIsHome && <span className="material-symbols-outlined text-primary text-[18px]">home</span>}
                {originIsHome ? 'Casa' : originIsMyLocation ? 'Mi ubicación' : 'Origen de ruta'}
              </h3>
              {originIsHome && user?.homeAddress ? (
                <p className="text-[12px] text-on-surface-variant mt-0.5 truncate">{user.homeAddress}</p>
              ) : (
                <p className="text-[12px] text-on-surface-variant mt-0.5 font-mono">
                  {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {hasLocation && !originIsMyLocation && (
                <button
                  onClick={useMyLocationAsOrigin}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high text-on-surface rounded-lg text-[11px] font-bold active:scale-95 transition-transform whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px]">my_location</span>
                  Usar mi ubicación
                </button>
              )}
              {originIsHome ? (
                <span className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-bold text-primary bg-primary/10 whitespace-nowrap">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Casa guardada
                </span>
              ) : (
                <button
                  onClick={saveAsHome}
                  disabled={savingHome}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-lg text-[11px] font-bold active:scale-95 transition-transform whitespace-nowrap disabled:opacity-50"
                >
                  {savingHome ? (
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">home</span>
                  )}
                  Guardar como casa
                </button>
              )}
            </div>
          </div>
          {homeMsg && (
            <p className={`text-[11px] font-bold ${homeMsg === 'Casa guardada' ? 'text-primary' : 'text-status-alert'}`}>
              {homeMsg}
            </p>
          )}
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
            {truckMarkers.length > 0 ? (
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#C62828]" />
                <span>Camión en ruta</span>
              </div>
            ) : truckRouteLines.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#2563eb]" />
                <span>Recorrido de la ruta</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#C62828]" />
              <span>Incidencia</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: originIsHome ? '#154212' : originIsMyLocation ? '#2563eb' : '#E8A317' }}
              />
              <span>{originIsHome ? 'Casa' : originIsMyLocation ? 'Mi ubicación' : 'Origen de ruta'}</span>
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
