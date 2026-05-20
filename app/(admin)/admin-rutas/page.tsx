'use client';

import { useState, useEffect } from 'react';
import { api, ApiClientError } from '@/lib/api';
import MapView, { type MapMarker } from '@/components/map-view';
import type { Zone, User, PickupPoint } from '@/lib/types';

interface RouteStop {
  id: string;
  orderIndex: number;
  status: string;
  pickupPoint: { id: string; name: string; address: string };
}

interface AdminRoute {
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

  // Form state
  const [formZone, setFormZone] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [selectedStops, setSelectedStops] = useState<PickupPoint[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Fetch pickup points when zone changes
  useEffect(() => {
    if (!formZone) { setPickupPoints([]); return; }
    api.get<PickupPoint[]>(`/pickup-points?zoneId=${formZone}`)
      .then(setPickupPoints)
      .catch(() => {});
  }, [formZone]);

  const toggleStop = (pp: PickupPoint) => {
    setSelectedStops((prev) => {
      const exists = prev.find((s) => s.id === pp.id);
      if (exists) return prev.filter((s) => s.id !== pp.id);
      return [...prev, pp];
    });
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    setSelectedStops((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleCreate = async () => {
    if (!formZone || !formDriver || selectedStops.length === 0) return;
    setFormLoading(true);
    try {
      await api.post('/routes', {
        zoneId: formZone,
        driverId: formDriver,
        pickupPointIds: selectedStops.map((s) => s.id),
      });
      setShowForm(false);
      setFormZone('');
      setFormDriver('');
      setSelectedStops([]);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al crear ruta');
    } finally {
      setFormLoading(false);
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

  // Map markers for available pickup points
  const availableMarkers: MapMarker[] = pickupPoints.map((pp) => ({
    id: pp.id,
    lng: pp.longitude,
    lat: pp.latitude,
    color: selectedStops.some((s) => s.id === pp.id) ? '#2E7D32' : '#154212',
    icon: selectedStops.some((s) => s.id === pp.id) ? 'check_circle' : 'location_on',
    label: pp.name,
  }));

  // Route line from selected stops
  const routeLine = selectedStops.length > 1 ? [{
    id: 'trazado',
    points: selectedStops.map((s) => [s.longitude, s.latitude] as [number, number]),
    color: '#154212',
  }] : [];

  const selectedZone = zones.find((z) => z.id === formZone);

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] leading-[32px] font-bold text-primary">Gestión de Rutas</h2>
          <p className="text-[14px] text-on-surface-variant">Crea rutas trazando puntos en el mapa</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSelectedStops([]); }}
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
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Map panel */}
            <div className="h-[500px] relative">
              {selectedZone ? (
                <MapView
                  center={pickupPoints.length > 0
                    ? [pickupPoints[0].longitude, pickupPoints[0].latitude]
                    : [-71.9675, -13.5320]}
                  zoom={14}
                  markers={availableMarkers}
                  routes={routeLine}
                  onMarkerClick={(m) => {
                    const pp = pickupPoints.find((p) => p.id === m.id);
                    if (pp) toggleStop(pp);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                  <div className="text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl">map</span>
                    <p className="text-[14px] mt-2">Selecciona una zona</p>
                  </div>
                </div>
              )}
            </div>

            {/* Form panel */}
            <div className="p-6 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
              <h3 className="text-[18px] font-bold text-on-surface">Nueva Ruta</h3>

              <div>
                <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Zona</label>
                <select
                  value={formZone}
                  onChange={(e) => { setFormZone(e.target.value); setSelectedStops([]); }}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Seleccionar zona...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Conductor</label>
                <select
                  value={formDriver}
                  onChange={(e) => setFormDriver(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Seleccionar conductor...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">
                    Paradas ({selectedStops.length})
                  </label>
                  {pickupPoints.length > 0 && (
                    <span className="text-[11px] text-on-surface-variant">
                      Click en el mapa para agregar
                    </span>
                  )}
                </div>
                {selectedStops.length === 0 ? (
                  <div className="bg-surface-container-low rounded-xl p-4 text-center">
                    <p className="text-[13px] text-on-surface-variant">
                      {formZone ? 'Haz click en los puntos del mapa para trazar la ruta' : 'Selecciona una zona primero'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {selectedStops.map((stop, i) => (
                      <div key={stop.id} className="flex items-center gap-2 bg-surface-container-low rounded-lg p-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-on-surface truncate">{stop.name}</p>
                          <p className="text-[11px] text-on-surface-variant truncate">{stop.address}</p>
                        </div>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => moveStop(i, -1)}
                            disabled={i === 0}
                            className="p-1 rounded hover:bg-surface-variant disabled:opacity-30 text-on-surface-variant"
                          >
                            <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
                          </button>
                          <button
                            onClick={() => moveStop(i, 1)}
                            disabled={i === selectedStops.length - 1}
                            className="p-1 rounded hover:bg-surface-variant disabled:opacity-30 text-on-surface-variant"
                          >
                            <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                          </button>
                          <button
                            onClick={() => toggleStop(stop)}
                            className="p-1 rounded hover:bg-error/10 text-error"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleCreate}
                disabled={!formZone || !formDriver || selectedStops.length === 0 || formLoading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 mt-auto"
              >
                {formLoading ? (
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">add</span>
                )}
                Crear Ruta ({selectedStops.length} paradas)
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm font-bold">Cargando rutas...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.length === 0 && (
            <div className="bg-surface-card rounded-xl p-8 text-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">route</span>
              <p className="text-on-surface-variant text-sm">No hay rutas registradas</p>
            </div>
          )}
          {routes.map((r) => (
            <div key={r.id} className="bg-surface-card rounded-xl p-5 border border-outline-variant/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[16px] font-bold text-on-surface">{r.zone?.name ?? 'Sin zona'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyles[r.status] ?? ''}`}>
                      {statusLabels[r.status] ?? r.status}
                    </span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant">
                    {r.driver?.fullName ?? 'Sin conductor'} · {r.totalStops} paradas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.stops.length > 0 && (
                    <details className="relative">
                      <summary className="text-[11px] font-bold text-primary cursor-pointer list-none px-3 py-1.5 rounded-lg hover:bg-primary/5">
                        Ver ruta
                      </summary>
                      <div className="absolute right-0 top-8 w-72 bg-surface-card rounded-xl shadow-2xl border border-outline-variant/20 p-3 z-50 max-h-60 overflow-y-auto">
                        {r.stops
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((s, i) => (
                            <div key={s.id} className="flex items-center gap-2 py-1.5">
                              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                                s.status === 'COMPLETED' ? 'bg-waste-organic/10 text-waste-organic' : 'bg-surface-container-high text-on-surface-variant'
                              }`}>
                                {s.status === 'COMPLETED' ? '✓' : i + 1}
                              </span>
                              <span className="text-[12px] text-on-surface truncate">{s.pickupPoint.name}</span>
                            </div>
                          ))}
                      </div>
                    </details>
                  )}
                  {r.status === 'PENDING' && (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) handleStatusChange(r.id, e.target.value); }}
                      className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none"
                      disabled={actionLoading === r.id}
                    >
                      <option value="">Acción...</option>
                      <option value="IN_PROGRESS">Iniciar</option>
                      <option value="CANCELLED">Cancelar</option>
                    </select>
                  )}
                  {r.status === 'IN_PROGRESS' && (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) handleStatusChange(r.id, e.target.value); }}
                      className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none"
                      disabled={actionLoading === r.id}
                    >
                      <option value="">Acción...</option>
                      <option value="COMPLETED">Completar</option>
                      <option value="CANCELLED">Cancelar</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      r.status === 'COMPLETED' ? 'bg-waste-organic' :
                      r.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                    style={{ width: `${Math.max(progress(r), r.status === 'IN_PROGRESS' ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[12px] font-bold text-on-surface-variant flex-shrink-0">
                  {r.completedStops}/{r.totalStops}
                </span>
              </div>

              {r.startedAt && (
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  Iniciada: {new Date(r.startedAt).toLocaleString('es-PE')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
