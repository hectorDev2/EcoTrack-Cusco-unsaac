'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api, ApiClientError } from '@/lib/api';
import MapView, { type MapMarker, type MapRoute } from '@/components/map-view';
import { calculateRoute, formatDistance, formatDuration, type RouteWaypoint } from '@/lib/routing';
import type { Zone, User, PickupPoint } from '@/lib/types';

interface RouteStop {
  id: string;
  orderIndex: number;
  status: string;
  pickupPoint: { id: string; name: string; address: string; latitude: number; longitude: number };
}

interface AdminRoute {
  id: string;
  name?: string | null;
  shift?: string | null;
  frequency?: string | null;
  zone: { id: string; name: string };
  driver: { id: string; fullName: string; email: string } | null;
  status: string;
  totalStops: number;
  completedStops: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  stops: RouteStop[];
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-surface-container-high text-on-surface-variant',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-waste-organic/10 text-waste-organic',
  CANCELLED: 'bg-error-container/30 text-error',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export default function AdminRutasPage() {
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formZone, setFormZone] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [calculatedRoute, setCalculatedRoute] = useState<MapRoute[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detalleRuta, setDetalleRuta] = useState<AdminRoute | null>(null);
  const calcTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // New pickup point modal
  const [newPointModal, setNewPointModal] = useState<{ lng: number; lat: number } | null>(null);
  const [newPointName, setNewPointName] = useState('');
  const [newPointAddress, setNewPointAddress] = useState('');
  const [creatingPoint, setCreatingPoint] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  // Route map modal
  const [routeMapModal, setRouteMapModal] = useState<AdminRoute | null>(null);
  const [routeMapRoute, setRouteMapRoute] = useState<MapRoute[]>([]);
  const [routeMapMarkers, setRouteMapMarkers] = useState<MapMarker[]>([]);
  const [routeMapInfo, setRouteMapInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [routeMapLoading, setRouteMapLoading] = useState(false);

  // Edit modal
  const [editRoute, setEditRoute] = useState<AdminRoute | null>(null);
  const [editName, setEditName] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get<AdminRoute[]>('/routes'),
      api.get<Zone[]>('/zones'),
      api.get<{ data: User[] }>('/users?role=DRIVER&limit=50').then((r) => r.data),
    ])
      .then(([routes, zones, drivers]) => {
        setRoutes(routes);
        setZones(zones);
        setDrivers(drivers);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!formZone) { setPickupPoints([]); return; }
    api.get<PickupPoint[]>(`/pickup-points?zoneId=${formZone}`)
      .then(setPickupPoints)
      .catch(() => {});
  }, [formZone]);

  useEffect(() => {
    if (calcTimeout.current) clearTimeout(calcTimeout.current);
    if (waypoints.length < 2) {
      setCalculatedRoute([]);
      setRouteInfo(null);
      return;
    }
    setCalculating(true);
    calcTimeout.current = setTimeout(async () => {
      const result = await calculateRoute(waypoints);
      if (result) {
        setCalculatedRoute([{
          id: 'trazado',
          points: result.coordinates,
          color: '#154212',
        }]);
        setRouteInfo({ distance: result.distance, duration: result.duration });
      }
      setCalculating(false);
    }, 400);
    return () => { if (calcTimeout.current) clearTimeout(calcTimeout.current); };
  }, [waypoints]);

  // Calcular ruta en el modal de mapa
  useEffect(() => {
    if (!routeMapModal) {
      setRouteMapRoute([]);
      setRouteMapMarkers([]);
      setRouteMapInfo(null);
      return;
    }

    const stops = routeMapModal.stops.sort((a, b) => a.orderIndex - b.orderIndex);
    const wps: RouteWaypoint[] = stops.map((s) => ({
      lng: s.pickupPoint.longitude,
      lat: s.pickupPoint.latitude,
      label: s.pickupPoint.address || s.pickupPoint.name,
    }));

    setRouteMapMarkers(stops.map((s) => ({
      id: s.id,
      lng: s.pickupPoint.longitude,
      lat: s.pickupPoint.latitude,
      color: s.status === 'COMPLETED' ? '#2E7D32' : '#154212',
      icon: (s.status === 'COMPLETED' ? 'check_circle' : 'location_on') as string,
      label: s.pickupPoint.address || s.pickupPoint.name,
    })));

    if (wps.length < 2) {
      setRouteMapRoute([]);
      setRouteMapInfo(null);
      return;
    }

    setRouteMapLoading(true);
    calculateRoute(wps).then((result) => {
      if (result) {
        setRouteMapRoute([{ id: 'ruta', points: result.coordinates, color: '#154212' }]);
        setRouteMapInfo({ distance: result.distance, duration: result.duration });
      }
    }).finally(() => setRouteMapLoading(false));
  }, [routeMapModal]);

  const addWaypoint = useCallback((lng: number, lat: number, label?: string, pickupPointId?: string) => {
    setWaypoints((prev) => [...prev, { lng, lat, label, pickupPointId }]);
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveWaypoint = useCallback((index: number, direction: -1 | 1) => {
    setWaypoints((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  // Click en pickup point existente — agrega/quita del trazado
  const togglePickupPoint = useCallback((pp: PickupPoint) => {
    const exists = waypoints.some((w) => w.pickupPointId === pp.id);
    if (exists) {
      setWaypoints((prev) => prev.filter((w) => w.pickupPointId !== pp.id));
      return;
    }
    addWaypoint(pp.longitude, pp.latitude, pp.name, pp.id);
  }, [waypoints, addWaypoint]);

  // Reverse geocode cuando se abre el modal
  useEffect(() => {
    if (!newPointModal) return;
    setResolvingAddress(true);
    setNewPointAddress('');
    setNewPointName('');

    const controller = new AbortController();
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPointModal.lat}&lon=${newPointModal.lng}&addressdetails=1`;

    fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'EcoTrackCusco/1.0' },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.display_name) {
          const parts = data.display_name.split(',');
          const street = parts.slice(0, 2).join(',').trim();
          setNewPointAddress(street);
          setNewPointName(parts[0]?.trim() ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setResolvingAddress(false));

    return () => controller.abort();
  }, [newPointModal]);

  // Click en el mapa — abre modal para crear nuevo punto
  const handleMapClick = useCallback((lng: number, lat: number) => {
    setNewPointModal({ lng, lat });
  }, []);

  // Crear el nuevo pickup point y agregarlo a la ruta
  const handleCreatePoint = async () => {
    if (!newPointModal || !newPointName.trim() || !formZone) return;
    setCreatingPoint(true);
    try {
      const pp = await api.post<PickupPoint>('/pickup-points', {
        zoneId: formZone,
        name: newPointName.trim(),
        address: newPointAddress.trim() || newPointName.trim(),
        latitude: newPointModal.lat,
        longitude: newPointModal.lng,
      });
      setPickupPoints((prev) => [...prev, pp]);
      addWaypoint(pp.longitude, pp.latitude, pp.name, pp.id);
      setNewPointModal(null);
      setNewPointName('');
      setNewPointAddress('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al crear punto');
    } finally {
      setCreatingPoint(false);
    }
  };

  const handleCreate = async () => {
    if (!formZone || !formDriver || waypoints.length === 0) return;
    setFormLoading(true);
    try {
      const pickupIds = waypoints
        .filter((w) => w.pickupPointId)
        .map((w) => w.pickupPointId!);
      await api.post('/routes', {
        zoneId: formZone,
        driverId: formDriver,
        pickupPointIds: pickupIds,
      });
      setShowForm(false);
      setFormZone('');
      setFormDriver('');
      setWaypoints([]);
      setCalculatedRoute([]);
      setRouteInfo(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al crear ruta');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditOpen = async (route: AdminRoute) => {
    setEditRoute(route);
    setEditName(route.name ?? '');
    setEditShift(route.shift ?? '');
    setEditFrequency(route.frequency ?? '');
    setFormDriver(route.driver?.id ?? '');
    setFormZone(route.zone.id);
    setCalculatedRoute([]);
    setRouteInfo(null);
    try {
      const pps = await api.get<PickupPoint[]>(`/pickup-points?zoneId=${route.zone.id}`);
      setPickupPoints(pps);
      const stops = [...route.stops].sort((a, b) => a.orderIndex - b.orderIndex);
      setWaypoints(stops.map((s) => ({
        lng: s.pickupPoint.longitude,
        lat: s.pickupPoint.latitude,
        label: s.pickupPoint.address || s.pickupPoint.name,
        pickupPointId: s.pickupPoint.id,
      })));
    } catch {}
  };

  const handleEditSave = async () => {
    if (!editRoute) return;
    setEditLoading(true);
    try {
      await api.patch(`/routes/${editRoute.id}`, {
        name: editName || undefined,
        shift: editShift || undefined,
        frequency: editFrequency || undefined,
        driverId: formDriver || undefined,
        pickupPointIds: waypoints.filter((w) => w.pickupPointId).map((w) => w.pickupPointId!),
      });
      setEditRoute(null);
      setWaypoints([]);
      setCalculatedRoute([]);
      setRouteInfo(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al guardar cambios');
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/routes/${id}`, { status });
      fetchData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al actualizar ruta');
    } finally {
      setActionLoading(null);
    }
  };

  const progress = (r: AdminRoute) =>
    r.totalStops > 0 ? Math.round((r.completedStops / r.totalStops) * 100) : 0;

  const markerIcon = (id: string) => waypoints.some((w) => w.pickupPointId === id) ? 'check_circle' : 'delete';

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] leading-[32px] font-bold text-primary">Gestión de Rutas</h2>
          <p className="text-[14px] text-on-surface-variant">Traza la ruta sobre el mapa — click en puntos existentes o en cualquier lugar para crear uno nuevo</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setWaypoints([]); setCalculatedRoute([]); setRouteInfo(null); }}
          className="bg-primary text-on-primary px-5 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2 active:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nueva Ruta'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-status-alert text-sm">error</span>
          <p className="text-status-alert text-sm font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-status-alert">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-surface-card rounded-xl border border-outline-variant/20 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Mapa */}
            <div className="lg:col-span-3 h-[550px] relative">
              {formZone ? (
                <MapView
                  center={pickupPoints.length > 0
                    ? [pickupPoints[0].longitude, pickupPoints[0].latitude]
                    : [-71.9675, -13.5320]}
                  zoom={15}
                  markers={pickupPoints.map((pp) => ({
                    id: pp.id,
                    lng: pp.longitude,
                    lat: pp.latitude,
                    color: waypoints.some((w) => w.pickupPointId === pp.id) ? '#2E7D32' : '#154212',
                    icon: markerIcon(pp.id) as string,
                    label: pp.name,
                  }))}
                  routes={calculatedRoute}
                  onMarkerClick={(m) => {
                    const pp = pickupPoints.find((p) => p.id === m.id);
                    if (pp) togglePickupPoint(pp);
                  }}
                  onMapClick={handleMapClick}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                  <div className="text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl">map</span>
                    <p className="text-[14px] mt-2">Selecciona una zona</p>
                  </div>
                </div>
              )}

              {formZone && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-surface/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-[12px] font-bold text-on-surface whitespace-nowrap">
                  Click en puntos existentes o en cualquier lugar del mapa para crear uno nuevo
                </div>
              )}

              {routeInfo && (
                <div className="absolute bottom-4 left-4 z-10 bg-surface/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg text-[12px] flex gap-4">
                  <span className="font-bold text-primary">{formatDistance(routeInfo.distance)}</span>
                  <span className="text-on-surface-variant">·</span>
                  <span className="font-bold text-primary">{formatDuration(routeInfo.duration)}</span>
                </div>
              )}

              {calculating && (
                <div className="absolute top-4 right-4 z-10 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-bold text-on-surface">Calculando ruta...</span>
                </div>
              )}
            </div>

            {/* Panel de control */}
            <div className="lg:col-span-2 p-6 flex flex-col gap-4 max-h-[550px] overflow-y-auto">
              <h3 className="text-[18px] font-bold text-on-surface">Nueva Ruta</h3>

              <div>
                <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Zona</label>
                <select value={formZone} onChange={(e) => { setFormZone(e.target.value); setWaypoints([]); }}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Seleccionar zona...</option>
                  {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Conductor</label>
                <select value={formDriver} onChange={(e) => setFormDriver(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Seleccionar conductor...</option>
                  {drivers.map((d) => (<option key={d.id} value={d.id}>{d.fullName}</option>))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Paradas ({waypoints.length})</label>
                  {routeInfo && (
                    <span className="text-[11px] text-on-surface-variant">{formatDistance(routeInfo.distance)} · {formatDuration(routeInfo.duration)}</span>
                  )}
                </div>

                {waypoints.length === 0 ? (
                  <div className="bg-surface-container-low rounded-xl p-4 text-center">
                    <p className="text-[13px] text-on-surface-variant">
                      {formZone ? 'Click en el mapa para agregar paradas' : 'Selecciona una zona primero'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                    {waypoints.map((wp, i) => {
                      const pp = pickupPoints.find((p) => p.id === wp.pickupPointId);
                      return (
                        <div key={`${wp.pickupPointId ?? 'wp'}-${i}`} className="flex items-center gap-2 bg-surface-container-low rounded-lg p-2">
                          <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-on-surface truncate">{pp?.name ?? wp.label ?? `Punto ${i + 1}`}</p>
                            {pp?.address && <p className="text-[11px] text-on-surface-variant truncate">{pp.address}</p>}
                          </div>
                          <div className="flex gap-0.5">
                            <button onClick={() => moveWaypoint(i, -1)} disabled={i === 0}
                              className="p-1 rounded hover:bg-surface-variant disabled:opacity-30 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
                            </button>
                            <button onClick={() => moveWaypoint(i, 1)} disabled={i === waypoints.length - 1}
                              className="p-1 rounded hover:bg-surface-variant disabled:opacity-30 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                            </button>
                            <button onClick={() => removeWaypoint(i)}
                              className="p-1 rounded hover:bg-error/10 text-error">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button onClick={handleCreate}
                disabled={!formZone || !formDriver || waypoints.length === 0 || formLoading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 mt-auto">
                {formLoading ? (
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">add</span>
                )}
                Crear Ruta ({waypoints.length} paradas)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo punto de recojo */}
      {newPointModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setNewPointModal(null)}>
          <div className="bg-surface-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-on-surface mb-1">Nuevo Punto de Recojo</h3>
            <p className="text-[13px] text-on-surface-variant mb-2">Agrega un punto en la ubicación seleccionada</p>

            <div className="mb-4 flex gap-4 text-[11px] text-on-surface-variant">
              <span>Lat: <strong>{newPointModal.lat.toFixed(5)}</strong></span>
              <span>Lng: <strong>{newPointModal.lng.toFixed(5)}</strong></span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Nombre</label>
                <input
                  value={newPointName}
                  onChange={(e) => setNewPointName(e.target.value)}
                  placeholder="Ej: Esquina Av. El Sol"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">
                  Dirección
                  {resolvingAddress && (
                    <span className="ml-2 text-on-surface-variant font-normal normal-case">
                      <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin align-middle mr-1" />
                      resolviendo...
                    </span>
                  )}
                </label>
                <input
                  value={newPointAddress}
                  onChange={(e) => setNewPointAddress(e.target.value)}
                  placeholder="Cargando dirección..."
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setNewPointModal(null)}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-[13px] font-bold text-on-surface-variant">
                Cancelar
              </button>
              <button onClick={handleCreatePoint}
                disabled={!newPointName.trim() || creatingPoint}
                className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {creatingPoint ? (
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">add_location</span>
                )}
                Agregar y trazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado de rutas */}
      {/* Listado de rutas en cards tipo flota */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm font-bold">Cargando rutas...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {routes.length === 0 && (
            <div className="col-span-full bg-surface-card rounded-xl p-8 text-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">route</span>
              <p className="text-on-surface-variant text-sm">No hay rutas registradas</p>
            </div>
          )}
          {routes.map((r) => {
            const cfg = statusStyles[r.status] ?? statusStyles.PENDING;
            return (
              <div key={r.id} className="bg-surface-card rounded-xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow group relative">
                {/* Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        r.status === 'IN_PROGRESS' ? 'bg-primary/10' : 'bg-surface-container-high'
                      }`}>
                        <span className={`material-symbols-outlined text-[20px] ${
                          r.status === 'IN_PROGRESS' ? 'text-primary' : 'text-on-surface-variant'
                        }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {r.status === 'IN_PROGRESS' ? 'local_shipping' : r.status === 'COMPLETED' ? 'check_circle' : 'schedule'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-on-surface leading-tight">
                          {r.zone?.name ?? 'Sin zona'}
                        </h3>
                        <p className="text-[11px] text-on-surface-variant">
                          {r.driver?.fullName ?? 'Sin conductor'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${cfg}`}>
                      {statusLabels[r.status] ?? r.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        r.status === 'COMPLETED' ? 'bg-waste-organic' :
                        r.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-outline-variant'
                      }`} style={{ width: `${Math.max(progress(r), r.status === 'IN_PROGRESS' ? 4 : 0)}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-on-surface-variant whitespace-nowrap">
                      {r.completedStops}/{r.totalStops}
                    </span>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="px-4 py-3 bg-surface-container/50 border-t border-outline-variant/10 rounded-b-xl flex flex-col gap-2">
                  {/* Fila 1: paradas + mapa + editar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.stops.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setDetalleRuta(detalleRuta?.id === r.id ? null : r)}
                          className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                          <span className="material-symbols-outlined text-[14px]">route</span>
                          {r.stops.length} paradas
                        </button>
                        {detalleRuta?.id === r.id && (
                          <div className="absolute left-0 bottom-full mb-1 w-64 bg-surface-card rounded-xl shadow-2xl border border-outline-variant/20 p-3 z-50 max-h-52 overflow-y-auto">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Paradas</p>
                            {r.stops.sort((a, b) => a.orderIndex - b.orderIndex).map((s, i) => (
                              <div key={s.id} className="flex items-center gap-2 py-1">
                                <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 ${
                                  s.status === 'COMPLETED' ? 'bg-waste-organic/10 text-waste-organic' : 'bg-surface-container-high text-on-surface-variant'
                                }`}>
                                  {s.status === 'COMPLETED' ? '✓' : i + 1}
                                </span>
                                <span className="text-[11px] text-on-surface truncate">{s.pickupPoint.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {r.startedAt && (
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(r.startedAt).toLocaleDateString('es-PE')}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => setRouteMapModal(r)}
                        className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline px-2 py-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">map</span>
                        Mapa
                      </button>
                      <button
                        onClick={() => handleEditOpen(r)}
                        className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1 hover:text-primary hover:underline px-2 py-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        Editar
                      </button>
                    </div>
                  </div>
                  {/* Fila 2: selector de acción (ancho completo) */}
                  <select
                    value=""
                    onChange={async (e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (val.startsWith('driver:')) {
                        const driverId = val.slice(7);
                        setActionLoading(r.id);
                        try {
                          await api.patch(`/routes/${r.id}`, { driverId });
                          fetchData();
                        } catch (err) {
                          setError(err instanceof ApiClientError ? err.message : 'Error al reasignar');
                        } finally {
                          setActionLoading(null);
                        }
                      } else {
                        handleStatusChange(r.id, val);
                      }
                    }}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-[10px] font-bold outline-none cursor-pointer hover:border-primary/40 transition-colors"
                    disabled={actionLoading === r.id}
                  >
                    <option value="">— Acción —</option>
                    {r.status === 'PENDING' && (
                      <>
                        <option value="IN_PROGRESS">Iniciar</option>
                        <option value="CANCELLED">Cancelar</option>
                      </>
                    )}
                    {r.status === 'IN_PROGRESS' && (
                      <>
                        <option value="COMPLETED">Completar</option>
                        <option value="CANCELLED">Cancelar</option>
                      </>
                    )}
                    {r.status === 'COMPLETED' && (
                      <option value="PENDING">Reabrir</option>
                    )}
                    <option disabled>────</option>
                    <option disabled className="text-[9px]">Reasignar a:</option>
                    {drivers.filter((d) => d.id !== r.driver?.id).map((d) => (
                      <option key={d.id} value={`driver:${d.id}`}>{d.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal edición de ruta */}
      {editRoute && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditRoute(null)}>
          <div className="bg-surface-card rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <div>
                <h3 className="text-[18px] font-bold text-on-surface">Editar Ruta</h3>
                <p className="text-[13px] text-on-surface-variant">{editRoute.name ?? editRoute.zone?.name ?? 'Sin nombre'}</p>
              </div>
              <button onClick={() => setEditRoute(null)} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Contenido: mapa + panel */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5 min-h-0">
              {/* Mapa */}
              <div className="lg:col-span-3 h-[420px] lg:h-auto relative">
                <MapView
                  center={pickupPoints.length > 0 ? [pickupPoints[0].longitude, pickupPoints[0].latitude] : [-71.9675, -13.5320]}
                  zoom={15}
                  markers={pickupPoints.map((pp) => ({
                    id: pp.id,
                    lng: pp.longitude,
                    lat: pp.latitude,
                    color: waypoints.some((w) => w.pickupPointId === pp.id) ? '#2E7D32' : '#154212',
                    icon: (waypoints.some((w) => w.pickupPointId === pp.id) ? 'check_circle' : 'location_on') as string,
                    label: pp.address || pp.name,
                  }))}
                  routes={calculatedRoute}
                  onMarkerClick={(m) => {
                    const pp = pickupPoints.find((p) => p.id === m.id);
                    if (pp) togglePickupPoint(pp);
                  }}
                />
                {routeInfo && (
                  <div className="absolute bottom-4 left-4 z-10 bg-surface/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg text-[12px] flex gap-4">
                    <span className="font-bold text-primary">{formatDistance(routeInfo.distance)}</span>
                    <span className="text-on-surface-variant">·</span>
                    <span className="font-bold text-primary">{formatDuration(routeInfo.duration)}</span>
                  </div>
                )}
                {calculating && (
                  <div className="absolute top-4 right-4 z-10 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] font-bold text-on-surface">Calculando...</span>
                  </div>
                )}
              </div>

              {/* Panel de edición */}
              <div className="lg:col-span-2 p-5 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-1.5">Nombre</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ej: Zona 1 — Mañana LMV"
                    className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-1.5">Turno</label>
                    <select value={editShift} onChange={(e) => setEditShift(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-primary outline-none">
                      <option value="">Sin turno</option>
                      <option value="MANANA">Mañana</option>
                      <option value="TARDE">Tarde</option>
                      <option value="NOCHE">Noche</option>
                      <option value="DOMINICAL">Dominical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-1.5">Frecuencia</label>
                    <select value={editFrequency} onChange={(e) => setEditFrequency(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-primary outline-none">
                      <option value="">Sin frecuencia</option>
                      <option value="LMV">Lun · Mié · Vie</option>
                      <option value="MJS">Mar · Jue · Sáb</option>
                      <option value="DOM">Solo Domingo</option>
                      <option value="DOM_LUN">Dom · Lun</option>
                      <option value="TODOS">Todos los días</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-1.5">Conductor</label>
                  <select value={formDriver} onChange={(e) => setFormDriver(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Sin conductor</option>
                    {drivers.map((d) => (<option key={d.id} value={d.id}>{d.fullName}</option>))}
                  </select>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Paradas ({waypoints.length})</label>
                    <span className="text-[10px] text-on-surface-variant">Click en marcadores del mapa</span>
                  </div>
                  {waypoints.length === 0 ? (
                    <div className="bg-surface-container-low rounded-xl p-3 text-center">
                      <p className="text-[12px] text-on-surface-variant">Sin paradas seleccionadas</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {waypoints.map((wp, i) => (
                        <div key={`edit-${wp.pickupPointId ?? i}`} className="flex items-center gap-2 bg-surface-container-low rounded-lg p-2">
                          <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="flex-1 text-[11px] font-bold text-on-surface truncate">{wp.label ?? `Punto ${i + 1}`}</span>
                          <div className="flex gap-0.5">
                            <button onClick={() => moveWaypoint(i, -1)} disabled={i === 0}
                              className="p-0.5 rounded hover:bg-surface-variant disabled:opacity-30 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[14px]">keyboard_arrow_up</span>
                            </button>
                            <button onClick={() => moveWaypoint(i, 1)} disabled={i === waypoints.length - 1}
                              className="p-0.5 rounded hover:bg-surface-variant disabled:opacity-30 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
                            </button>
                            <button onClick={() => removeWaypoint(i)}
                              className="p-0.5 rounded hover:bg-error/10 text-error">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditRoute(null)}
                    className="flex-1 py-2.5 rounded-xl border border-outline-variant text-[13px] font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleEditSave} disabled={editLoading}
                    className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-md transition-shadow">
                    {editLoading ? (
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">save</span>
                    )}
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal mapa de ruta */}
      {routeMapModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRouteMapModal(null)}>
          <div className="bg-surface-card rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <div>
                <h3 className="text-[18px] font-bold text-on-surface">
                  {routeMapModal.name ?? routeMapModal.zone?.name ?? 'Ruta'}
                </h3>
                <p className="text-[13px] text-on-surface-variant">
                  {routeMapModal.driver?.fullName ?? 'Sin conductor'} · {routeMapModal.totalStops} paradas
                  {routeMapInfo && (
                    <span> · {formatDistance(routeMapInfo.distance)} · {formatDuration(routeMapInfo.duration)}</span>
                  )}
                </p>
              </div>
              <button onClick={() => setRouteMapModal(null)} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Mapa */}
            <div className="relative h-[450px]">
              {routeMapLoading && (
                <div className="absolute top-4 right-4 z-10 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-bold text-on-surface">Calculando ruta...</span>
                </div>
              )}
              <MapView
                markers={routeMapMarkers}
                routes={routeMapRoute}
              />
            </div>

            {/* Lista de paradas */}
            <div className="p-4 border-t border-outline-variant/20 max-h-40 overflow-y-auto">
              <div className="flex gap-2 flex-wrap">
                {routeMapModal.stops.sort((a, b) => a.orderIndex - b.orderIndex).map((s, i) => (
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
          </div>
        </div>
      )}
    </div>
  );
}
