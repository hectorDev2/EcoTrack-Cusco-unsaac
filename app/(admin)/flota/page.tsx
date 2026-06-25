'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ApiClientError } from '@/lib/api';
import MapView, { type MapMarker, type MapRoute } from '@/components/map-view';
import { calculateRoute, formatDistance, formatDuration, type RouteWaypoint } from '@/lib/routing';

interface RouteStop {
  id: string;
  orderIndex: number;
  status: string;
  pickupPoint: { id: string; name: string; address: string; latitude: number; longitude: number };
}

interface FleetRoute {
  id: string;
  name: string;
  zone: string;
  driver: string;
  status: string;
  progress: number;
  totalStops: number;
  completedStops: number;
  startedAt: string | null;
  createdAt: string;
}

interface FleetData {
  totalRoutes: number;
  inTransit: number;
  pending: number;
  completed: number;
  alerts: number;
  routes: FleetRoute[];
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  capacity: number | null;
  driverId: string | null;
  status: string;
  createdAt: string;
  driver: { id: string; fullName: string; email: string } | null;
}

interface RouteLocation {
  id: string;
  routeId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
}

interface FullRoute {
  id: string;
  zone: { id: string; name: string };
  driver: { id: string; fullName: string; email: string };
  status: string;
  totalStops: number;
  completedStops: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  stops: RouteStop[];
}

const statusConfig: Record<string, { label: string; color: string; barColor: string }> = {
  IN_PROGRESS: { label: 'En ruta', color: 'text-primary', barColor: 'bg-primary' },
  PENDING: { label: 'Pendiente', color: 'text-on-surface-variant', barColor: 'bg-outline-variant' },
  COMPLETED: { label: 'Completado', color: 'text-waste-organic', barColor: 'bg-waste-organic' },
  CANCELLED: { label: 'Detenido', color: 'text-error', barColor: 'bg-error' },
};

export default function FlotaPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [data, setData] = useState<FleetData | null>(null);
  const [allRoutes, setAllRoutes] = useState<FullRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [livePositions, setLivePositions] = useState<Record<string, { lat: number; lng: number; driver: string }>>({});
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const inTransitRoutes = allRoutes.filter((r) => r.status === 'IN_PROGRESS');
    if (inTransitRoutes.length === 0) return;

    pollRef.current = setInterval(async () => {
      const positions: Record<string, { lat: number; lng: number; driver: string }> = {};
      for (const r of inTransitRoutes) {
        try {
          const locs = await api.get<RouteLocation[]>(`/routes/${r.id}/locations`);
          if (locs.length > 0) {
            const last = locs[locs.length - 1];
            positions[r.id] = { lat: last.latitude, lng: last.longitude, driver: r.driver.fullName };
          }
        } catch {}
      }
      if (Object.keys(positions).length > 0) {
        setLivePositions((prev) => ({ ...prev, ...positions }));
      }
    }, 10000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [allRoutes]);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ plate: '', brand: '', model: '', capacity: '', driverId: '' });
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  const fetchVehicles = () => {
    api.get<Vehicle[]>('/vehicles').then(setVehicles).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<FleetData>('/routes/fleet'),
      api.get<FullRoute[]>('/routes'),
      api.get<Vehicle[]>('/vehicles').then((v) => { setVehicles(v); return v; }).catch(() => []),
    ])
      .then(([fleet, routes]) => {
        setData(fleet);
        setAllRoutes(routes);
      })
      .catch((err) => setError(err.message ?? 'Error al cargar flota'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateVehicle = async () => {
    setVehicleError(null);
    if (!vehicleForm.plate.trim()) { setVehicleError('La placa es obligatoria'); return; }
    setVehicleSaving(true);
    try {
      const body: Record<string, string> = { plate: vehicleForm.plate.trim() };
      if (vehicleForm.brand) body.brand = vehicleForm.brand;
      if (vehicleForm.model) body.model = vehicleForm.model;
      if (vehicleForm.capacity) body.capacity = vehicleForm.capacity;
      if (vehicleForm.driverId) body.driverId = vehicleForm.driverId;
      await api.post('/vehicles', body);
      fetchVehicles();
      setShowVehicleModal(false);
      setVehicleForm({ plate: '', brand: '', model: '', capacity: '', driverId: '' });
    } catch (err) {
      setVehicleError(err instanceof ApiClientError ? err.message : 'Error al crear vehículo');
    } finally {
      setVehicleSaving(false);
    }
  };

const [modalRouteId, setModalRouteId] = useState<string | null>(null);
  const [modalMarkers, setModalMarkers] = useState<MapMarker[]>([]);
  const [modalRouteLine, setModalRouteLine] = useState<MapRoute[]>([]);
  const [modalInfo, setModalInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const openRouteModal = useCallback(async (routeId: string) => {
    const route = allRoutes.find((r) => r.id === routeId);
    if (!route) return;
    setModalRouteId(routeId);
    setModalMarkers([]);
    setModalRouteLine([]);
    setModalInfo(null);
    setModalLoading(true);

    const stops = [...route.stops].sort((a, b) => a.orderIndex - b.orderIndex);
    setModalMarkers(stops.map((s) => ({
      id: s.id,
      lng: s.pickupPoint.longitude,
      lat: s.pickupPoint.latitude,
      color: s.status === 'COMPLETED' ? '#2E7D32' : '#154212',
      icon: (s.status === 'COMPLETED' ? 'check_circle' : 'location_on') as string,
      label: s.pickupPoint.name,
    })));

    if (stops.length >= 2) {
      const wps: RouteWaypoint[] = stops.map((s) => ({
        lng: s.pickupPoint.longitude,
        lat: s.pickupPoint.latitude,
        label: s.pickupPoint.name,
      }));
      const result = await calculateRoute(wps);
      if (result) {
        setModalRouteLine([{ id: 'modal-ruta', points: result.coordinates, color: '#154212' }]);
        setModalInfo({ distance: result.distance, duration: result.duration });
      }
    }
    setModalLoading(false);
  }, [allRoutes]);

  const closeModal = () => {
    setModalRouteId(null);
    setModalMarkers([]);
    setModalRouteLine([]);
    setModalInfo(null);
  };

  // Live position markers (drivers in transit)
  const liveMarkers: MapMarker[] = Object.entries(livePositions).map(([routeId, pos]) => ({
    id: `live-${routeId}`,
    lng: pos.lng,
    lat: pos.lat,
    color: '#2196F3',
    icon: 'directions_car' as const,
    label: pos.driver,
  }));

  // Overview map markers: use first stop coordinates from allRoutes
  const overviewMarkers: MapMarker[] = [
    ...liveMarkers,
    ...(data?.routes ?? [])
      .filter((r) => !livePositions[r.id])
      .flatMap((r) => {
        const full = allRoutes.find((fr) => fr.id === r.id);
        const firstStop = full?.stops?.[0];
        if (!firstStop) return [];
        return [{
          id: r.id,
          lng: firstStop.pickupPoint.longitude,
          lat: firstStop.pickupPoint.latitude,
          color: r.status === 'IN_PROGRESS' ? '#154212' : r.status === 'COMPLETED' ? '#2E7D32' : '#757575',
          icon: 'local_shipping' as const,
          label: r.name,
        }];
      }),
  ];

  const inTransitCount = data?.routes.filter((r) => r.status === 'IN_PROGRESS').length ?? 0;
  const alertCount = data?.routes.filter((r) => r.status === 'CANCELLED').length ?? 0;

  return (
    <div className="bg-background text-on-surface font-body-md overflow-hidden h-screen">
      <header className="flex justify-between items-center w-full px-6 py-2 bg-surface border-b border-outline-variant/30 sticky top-0 z-40">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-[16px] leading-[24px] focus:ring-2 focus:ring-primary focus:bg-white transition-all" placeholder="Buscar camiones o rutas..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant relative transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              {alertCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-status-alert rounded-full" />}
            </button>
            <button className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"><span className="material-symbols-outlined">help</span></button>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant/50 mx-2" />
          <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-variant/30 p-1 pr-3 rounded-full transition-all">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface leading-tight">Municipalidad de Wanchaq</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-wider">Panel de Flota</p>
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-64px)] relative">
        <MapView
          markers={overviewMarkers}
          routes={[]}
          height="100%"
          onMarkerClick={(m) => {
            if (!m.id.startsWith('live-')) openRouteModal(m.id);
          }}
        />

        <aside className="absolute left-6 top-6 bottom-6 w-80 glass-panel rounded-2xl shadow-2xl border border-white/40 flex flex-col z-30 overflow-hidden">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[12px] text-on-surface-variant font-bold">Cargando flota...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-status-alert text-[14px] font-bold text-center">{error}</p>
            </div>
          )}

          {data && (
            <>
              <div className="p-4 border-b border-outline-variant/30">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[18px] font-bold text-on-surface">Vehículos</h2>
                  <button
                    onClick={() => { setVehicleForm({ plate: '', brand: '', model: '', capacity: '', driverId: '' }); setVehicleError(null); setShowVehicleModal(true); }}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {vehicles.length === 0 && (
                    <p className="text-[11px] text-on-surface-variant text-center py-2">Sin vehículos registrados</p>
                  )}
                  {vehicles.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low text-[12px]">
                      <span className="material-symbols-outlined text-sm text-primary">local_shipping</span>
                      <span className="font-bold text-on-surface flex-1">{v.plate}</span>
                      {v.driver && <span className="text-on-surface-variant truncate max-w-[80px]">{v.driver.fullName}</span>}
                      <span className={`w-2 h-2 rounded-full ${v.status === 'ACTIVE' ? 'bg-waste-organic' : v.status === 'MAINTENANCE' ? 'bg-status-alert' : 'bg-outline'}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-outline-variant/30">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[18px] font-bold text-on-surface">Rutas</h2>
                  <span className="bg-primary/10 text-primary text-[9px] px-2 py-1 rounded-full font-extrabold uppercase tracking-widest">Live</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-primary text-white rounded-full text-[11px] font-bold cursor-pointer">Todas</span>
                  {alertCount > 0 && (
                    <span className="px-3 py-1.5 bg-white border border-outline-variant text-on-surface-variant rounded-full text-[11px] font-bold hover:bg-surface-variant cursor-pointer transition-colors">
                      Problemas ({alertCount})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {data.routes.length === 0 && (
                  <p className="text-center text-on-surface-variant text-[14px] py-8">No hay rutas activas</p>
                )}
                {data.routes.map((route) => {
                  const cfg = statusConfig[route.status] ?? statusConfig.PENDING;
                  const fullRoute = allRoutes.find((r) => r.id === route.id);
                  return (
                    <div
                      key={route.id}
                      onClick={() => openRouteModal(route.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm group ${
                        modalRouteId === route.id
                          ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30'
                          : route.status === 'CANCELLED'
                            ? 'bg-error-container/20 border-error/20 hover:border-error/40'
                            : 'bg-white border-outline-variant/40 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            route.status === 'CANCELLED' ? 'bg-error-container/40 text-error' : 'bg-surface-container-high'
                          } ${cfg.color}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {route.status === 'CANCELLED' ? 'warning' : 'local_shipping'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface">{route.name}</h3>
                            <p className="text-[11px] text-on-surface-variant">{route.driver}</p>
                          </div>
                        </div>
                        <span className={`text-[12px] font-extrabold ${cfg.color}`}>
                          {route.status === 'CANCELLED' ? 'Stopped' : `${route.progress}%`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-3">
                        <div className={`h-full rounded-full ${cfg.barColor}`} style={{ width: `${Math.max(route.progress, 2)}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`flex items-center gap-1 ${route.status === 'CANCELLED' ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                          {route.status === 'CANCELLED' ? (
                            <span className="material-symbols-outlined text-[14px]">bolt</span>
                          ) : (
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                          )}
                          {route.status === 'PENDING' ? 'Sin iniciar' :
                           route.status === 'COMPLETED' ? 'Completado' :
                           route.status === 'IN_PROGRESS' ? `${route.completedStops}/${route.totalStops} paradas` :
                           'Detenido'}
                        </span>
                        {fullRoute && fullRoute.stops.length > 0 && (
                          <span className="text-on-surface-variant text-[10px]">
                            {fullRoute.stops.length} paradas
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-surface-container-high border-t border-outline-variant/30">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">En Tránsito</p>
                    <p className="text-[20px] leading-[28px] font-bold text-primary">{inTransitCount}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Pendientes</p>
                    <p className="text-[20px] leading-[28px] font-bold text-secondary">{data.pending}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>

        <div className="absolute top-6 right-6 glass-panel rounded-xl shadow-lg border border-white/40 p-3 z-30 flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">En ruta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-outline-variant" />
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-waste-organic" />
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Completado</span>
          </div>
        </div>

        {showVehicleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowVehicleModal(false)}>
            <div className="bg-surface-card rounded-2xl shadow-xl border border-outline-variant w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-extrabold text-primary">Agregar vehículo</h3>
                <button onClick={() => setShowVehicleModal(false)} className="p-1 text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {vehicleError && (
                <div className="mb-3 bg-status-alert/10 border border-status-alert/30 rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-status-alert text-sm">error</span>
                  <p className="text-status-alert text-sm font-bold flex-1">{vehicleError}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Placa *</label>
                  <input
                    type="text"
                    value={vehicleForm.plate}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, plate: e.target.value }))}
                    placeholder="ABC-123"
                    className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Marca</label>
                    <input
                      type="text"
                      value={vehicleForm.brand}
                      onChange={(e) => setVehicleForm((f) => ({ ...f, brand: e.target.value }))}
                      placeholder="Toyota"
                      className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Modelo</label>
                    <input
                      type="text"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))}
                      placeholder="Hilux"
                      className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Capacidad (kg)</label>
                  <input
                    type="number"
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, capacity: e.target.value }))}
                    placeholder="1000"
                    className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowVehicleModal(false)}
                  disabled={vehicleSaving}
                  className="flex-1 bg-surface-container-high text-on-surface py-3 rounded-xl text-[14px] font-bold active:opacity-80 transition-opacity disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateVehicle}
                  disabled={vehicleSaving}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {vehicleSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Agregar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Route detail modal */}
        {modalRouteId && (() => {
          const fleetRoute = data?.routes.find((r) => r.id === modalRouteId);
          const fullRoute = allRoutes.find((r) => r.id === modalRouteId);
          if (!fleetRoute) return null;
          const cfg = statusConfig[fleetRoute.status] ?? statusConfig.PENDING;
          const stops = fullRoute ? [...fullRoute.stops].sort((a, b) => a.orderIndex - b.orderIndex) : [];
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeModal}>
              <div
                className="bg-surface rounded-2xl shadow-2xl border border-outline-variant/40 w-full max-w-2xl mx-4 flex flex-col overflow-hidden"
                style={{ maxHeight: '90vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-start justify-between p-5 border-b border-outline-variant/30">
                  <div>
                    <h2 className="text-[20px] font-extrabold text-on-surface">{fleetRoute.name}</h2>
                    <p className="text-[13px] text-on-surface-variant mt-0.5">{fleetRoute.zone} · {fleetRoute.driver}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[12px] font-extrabold px-3 py-1 rounded-full bg-surface-container-high ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-surface-variant text-on-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Map section */}
                <div className="relative" style={{ height: 320 }}>
                  {modalLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/70">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-[11px] text-on-surface-variant font-bold">Calculando ruta...</p>
                      </div>
                    </div>
                  )}
                  {stops.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low">
                      <p className="text-[13px] text-on-surface-variant">Sin paradas registradas</p>
                    </div>
                  ) : (
                    <MapView markers={modalMarkers} routes={modalRouteLine} height="100%" />
                  )}
                  {modalInfo && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-surface/90 backdrop-blur px-4 py-1.5 rounded-full shadow-lg flex items-center gap-3 text-[12px]">
                      <span className="font-bold text-primary">{formatDistance(modalInfo.distance)}</span>
                      <span className="text-on-surface-variant">·</span>
                      <span className="font-bold text-primary">{formatDuration(modalInfo.duration)}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="px-5 pt-4">
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span className="font-bold text-on-surface-variant uppercase tracking-wide">Progreso</span>
                    <span className={`font-extrabold ${cfg.color}`}>{fleetRoute.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.barColor}`} style={{ width: `${Math.max(fleetRoute.progress, 2)}%` }} />
                  </div>
                </div>

                {/* Stops list */}
                <div className="flex-1 overflow-y-auto p-5">
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-3">
                    Paradas ({stops.length})
                  </p>
                  {stops.length === 0 ? (
                    <p className="text-[13px] text-on-surface-variant text-center py-4">Sin paradas</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {stops.map((s, i) => (
                        <div key={s.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] ${
                          s.status === 'COMPLETED' ? 'bg-waste-organic/10' : 'bg-surface-container-low'
                        }`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 ${
                            s.status === 'COMPLETED' ? 'bg-waste-organic text-white' : 'bg-outline-variant text-on-surface-variant'
                          }`}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-on-surface truncate">{s.pickupPoint.name}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">{s.pickupPoint.address}</p>
                          </div>
                          {s.status === 'COMPLETED' && (
                            <span className="material-symbols-outlined text-waste-organic text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats footer */}
                <div className="p-5 border-t border-outline-variant/30 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Paradas</p>
                    <p className="text-[18px] font-extrabold text-on-surface">{fleetRoute.completedStops}/{fleetRoute.totalStops}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Estado</p>
                    <p className={`text-[14px] font-extrabold ${cfg.color}`}>{cfg.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Zona</p>
                    <p className="text-[14px] font-extrabold text-on-surface truncate">{fleetRoute.zone}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
