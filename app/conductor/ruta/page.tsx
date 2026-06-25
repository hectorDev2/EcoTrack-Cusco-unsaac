'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';

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
  stops: RouteStop[];
}

const SHIFT_LABELS: Record<string, string> = {
  MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche', DOMINICAL: 'Dominical',
};

const wasteTypes = [
  { id: 'org', name: 'Orgánico', category: 'ORGANIC' },
  { id: 'rec', name: 'Reciclable', category: 'RECYCLABLE' },
  { id: 'nrec', name: 'No Reciclable', category: 'NON_RECYCLABLE' },
  { id: 'pelig', name: 'Peligroso', category: 'HAZARDOUS' },
];

export default function DriverRutaPage() {
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [completeModal, setCompleteModal] = useState<{ stopId: string; stopName: string } | null>(null);
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [notes, setNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const router = useRouter();

  const fetchData = () => {
    setLoading(true);
    api.get<DriverRoute[]>('/routes/my')
      .then(setRoutes)
      .catch((err) => setError(err.message ?? 'Error al cargar datos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const activeRoute = routes.find((r) => r.status === 'IN_PROGRESS') ?? routes.find((r) => r.status === 'PENDING');
  const pendingStops = activeRoute?.stops.filter((s) => s.status === 'PENDING') ?? [];
  const completedStops = activeRoute?.stops.filter((s) => s.status === 'COMPLETED') ?? [];

  useEffect(() => {
    if (!activeRoute || activeRoute.status !== 'IN_PROGRESS') return;

    let lastLat = 0, lastLng = 0, lastTime = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const now = Date.now();
        const moved = Math.sqrt((lat - lastLat) ** 2 + (lng - lastLng) ** 2) * 111320 > 20;
        if (!moved && now - lastTime < 15000) return;
        lastLat = lat; lastLng = lng; lastTime = now;

        api.post(`/routes/${activeRoute.id}/location`, { latitude: lat, longitude: lng })
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeRoute?.id, activeRoute?.status]);

  const handleCompleteStop = async () => {
    if (!completeModal || !selectedWasteType) return;
    setModalLoading(true);
    try {
      await api.post('/collections', {
        routeStopId: completeModal.stopId,
        wasteTypeId: selectedWasteType,
        notes: notes || undefined,
      });
      setCompleteModal(null);
      setSelectedWasteType('');
      setNotes('');
      fetchData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al registrar recolección');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCompleteRoute = async () => {
    if (!activeRoute) return;
    setActionLoading('complete');
    try {
      await api.patch(`/routes/${activeRoute.id}/complete`);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al completar ruta');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-bold">Cargando ruta...</p>
        </div>
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="bg-surface-card rounded-2xl p-8 text-center border border-outline-variant/20">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">route</span>
        <h2 className="text-[20px] font-bold text-on-surface mb-2">Sin ruta activa</h2>
        <p className="text-on-surface-variant text-sm mb-4">No tienes una ruta en curso. Regresa al inicio para iniciar una.</p>
        <button onClick={() => router.push('/conductor/dashboard')} className="text-primary text-[13px] font-bold hover:underline">
          Ir a Mi Ruta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-status-alert text-sm">error</span>
          <p className="text-status-alert text-sm font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-status-alert">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="bg-surface-card rounded-2xl p-5 border border-outline-variant/20">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-[20px] font-extrabold text-primary">
              {activeRoute.name ?? activeRoute.zone?.name ?? 'Ruta'}
            </h2>
            <p className="text-[12px] text-on-surface-variant">
              {activeRoute.zone?.name}
              {activeRoute.shift ? ` · ${SHIFT_LABELS[activeRoute.shift] ?? activeRoute.shift}` : ''}
              {activeRoute.frequency ? ` · ${activeRoute.frequency}` : ''}
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
        <p className="text-[13px] text-on-surface-variant">
          {activeRoute.completedStops}/{activeRoute.totalStops} paradas completadas
        </p>
      </div>

      {activeRoute.status === 'PENDING' && (
        <div className="bg-surface-container-low rounded-xl p-5 text-center">
          <p className="text-on-surface-variant text-sm mb-3">Inicia la ruta desde el panel principal para empezar a registrar paradas.</p>
          <button onClick={() => router.push('/conductor/dashboard')} className="text-primary text-[13px] font-bold hover:underline">
            Ir a Mi Ruta
          </button>
        </div>
      )}

      {activeRoute.status === 'IN_PROGRESS' && (
        <>
          {pendingStops.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-bold text-on-surface-variant uppercase tracking-[0.08em] px-1">
                Pendientes ({pendingStops.length})
              </h3>
              {pendingStops.map((stop) => (
                <div key={stop.id} className="bg-surface-card rounded-xl p-4 border border-outline-variant/20 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 text-[13px] font-bold">
                    {stop.orderIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-on-surface truncate">{stop.pickupPoint.name}</p>
                    <p className="text-[12px] text-on-surface-variant truncate">{stop.pickupPoint.address}</p>
                  </div>
                  <button
                    onClick={() => setCompleteModal({ stopId: stop.id, stopName: stop.pickupPoint.name })}
                    className="bg-primary text-on-primary px-4 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 active:opacity-80 transition-opacity flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    Completar
                  </button>
                </div>
              ))}
            </div>
          )}

          {completedStops.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-bold text-on-surface-variant uppercase tracking-[0.08em] px-1">
                Completadas ({completedStops.length})
              </h3>
              {completedStops.map((stop) => (
                <div key={stop.id} className="bg-surface-card rounded-xl p-4 border border-waste-organic/20 flex items-center gap-4 opacity-70">
                  <div className="w-9 h-9 rounded-full bg-waste-organic/10 flex items-center justify-center text-waste-organic flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-on-surface truncate">{stop.pickupPoint.name}</p>
                    <p className="text-[12px] text-on-surface-variant truncate">{stop.pickupPoint.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingStops.length === 0 && completedStops.length > 0 && (
            <div className="bg-waste-organic/10 border border-waste-organic/20 rounded-xl p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-waste-organic mb-2">check_circle</span>
              <h3 className="text-[18px] font-bold text-on-surface mb-1">¡Ruta completada!</h3>
              <p className="text-on-surface-variant text-sm mb-4">Todas las paradas han sido registradas.</p>
              <button
                onClick={handleCompleteRoute}
                disabled={actionLoading === 'complete'}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl text-[13px] font-bold flex items-center gap-2 mx-auto active:opacity-80 transition-opacity disabled:opacity-50"
              >
                {actionLoading === 'complete' ? (
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                )}
                Finalizar Ruta
              </button>
            </div>
          )}
        </>
      )}

      {completeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20">
            <h3 className="text-[18px] font-bold text-on-surface mb-1">Registrar recolección</h3>
            <p className="text-[13px] text-on-surface-variant mb-5">{completeModal.stopName}</p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">
                  Tipo de residuo
                </label>
                <select
                  value={selectedWasteType}
                  onChange={(e) => setSelectedWasteType(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {wasteTypes.map((wt) => (
                    <option key={wt.id} value={wt.id}>{wt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Contenedor al 80% de capacidad"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none resize-none h-20"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setCompleteModal(null); setSelectedWasteType(''); setNotes(''); }}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-[13px] font-bold text-on-surface-variant"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteStop}
                disabled={!selectedWasteType || modalLoading}
                className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {modalLoading ? (
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                )}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
