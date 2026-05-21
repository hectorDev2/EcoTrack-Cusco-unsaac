'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedMarkers, setSelectedMarkers] = useState<MapMarker[]>([]);
  const [selectedRouteLine, setSelectedRouteLine] = useState<MapRoute[]>([]);
  const [selectedInfo, setSelectedInfo] = useState<{ distance: number; duration: number } | null>(null);
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

  const focusRoute = useCallback(async (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = allRoutes.find((r) => r.id === routeId);
    if (!route) return;

    const stops = [...route.stops].sort((a, b) => a.orderIndex - b.orderIndex);

    setSelectedMarkers(stops.map((s) => ({
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
        setSelectedRouteLine([{ id: 'ruta', points: result.coordinates, color: '#154212' }]);
        setSelectedInfo({ distance: result.distance, duration: result.duration });
        return;
      }
    }
    setSelectedRouteLine([]);
    setSelectedInfo(null);
  }, [allRoutes]);

  // Map markers: selected route's stops + other routes as single markers
  const mapMarkers: MapMarker[] = selectedRouteId
    ? selectedMarkers
    : (data?.routes ?? []).map((r, i) => ({
        id: r.id,
        lng: [-71.9781, -71.9756, -71.9600, -71.9567, -71.9890][i % 5],
        lat: [-13.5167, -13.5156, -13.5222, -13.5278, -13.5345][i % 5],
        color: '#154212',
        icon: 'local_shipping' as const,
        label: r.name,
      }));

  const mapRoutes: MapRoute[] = selectedRouteId ? selectedRouteLine : [];

  const clearSelection = () => {
    setSelectedRouteId(null);
    setSelectedMarkers([]);
    setSelectedRouteLine([]);
    setSelectedInfo(null);
  };

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
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface leading-tight">Panel de Administración</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-wider">Superusuario Municipal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-64px)] relative">
        <MapView
          markers={mapMarkers}
          routes={mapRoutes}
          height="100%"
          onMarkerClick={(m) => {
            if (!selectedRouteId) focusRoute(m.id);
          }}
        />

        {selectedRouteId && selectedInfo && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-surface/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-4 text-[12px]">
            <span className="font-bold text-primary">{formatDistance(selectedInfo.distance)}</span>
            <span className="text-on-surface-variant">·</span>
            <span className="font-bold text-primary">{formatDuration(selectedInfo.duration)}</span>
          </div>
        )}

        {selectedRouteId && (
          <div className="absolute top-4 right-4 z-10">
            <button onClick={clearSelection} className="bg-surface/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg text-[12px] font-bold text-on-surface flex items-center gap-1 hover:bg-surface transition-colors">
              <span className="material-symbols-outlined text-[16px]">close</span>
              Vista general
            </button>
          </div>
        )}

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
                  const isSelected = selectedRouteId === route.id;
                  const fullRoute = allRoutes.find((r) => r.id === route.id);
                  return (
                    <div
                      key={route.id}
                      onClick={() => focusRoute(route.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm group ${
                        isSelected
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

        <div className="absolute top-6 right-6 glass-panel rounded-xl shadow-lg border border-white/40 p-3 z-30 flex gap-4" style={{ right: selectedRouteId ? '160px' : '24px' }}>
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
      </main>
    </div>
  );
}
