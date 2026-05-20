'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import MapView, { type MapMarker, type MapRoute } from '@/components/map-view';

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

const statusConfig: Record<string, { label: string; color: string; barColor: string; icon: string }> = {
  IN_PROGRESS: { label: 'En ruta', color: 'text-primary', barColor: 'bg-primary', icon: 'local_shipping' },
  PENDING: { label: 'Pendiente', color: 'text-on-surface-variant', barColor: 'bg-outline-variant', icon: 'schedule' },
  COMPLETED: { label: 'Completado', color: 'text-waste-organic', barColor: 'bg-waste-organic', icon: 'check_circle' },
  CANCELLED: { label: 'Detenido', color: 'text-error', barColor: 'bg-error', icon: 'warning' },
};

export default function FlotaPage() {
  const [data, setData] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<FleetData>('/routes/fleet')
      .then(setData)
      .catch((err) => setError(err.message ?? 'Error al cargar flota'))
      .finally(() => setLoading(false));
  }, []);

  const inTransitCount = data?.routes.filter((r) => r.status === 'IN_PROGRESS').length ?? 0;
  const alertCount = data?.routes.filter((r) => r.status === 'CANCELLED').length ?? 0;

  return (
    <div className="bg-background text-on-surface font-body-md overflow-hidden h-screen">
      <header className="flex justify-between items-center w-full px-6 py-2 bg-surface border-b border-outline-variant/30 sticky top-0 z-40">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-[16px] leading-[24px] focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              placeholder="Buscar camiones o rutas..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant relative transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              {alertCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-status-alert rounded-full" />}
            </button>
            <button className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant/50 mx-2" />
          <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-variant/30 p-1 pr-3 rounded-full transition-all">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface leading-tight">
                Panel de Administración
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-wider">
                Superusuario Municipal
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-64px)] relative">
        {data ? (
          <MapView
            markers={data.routes.filter((r) => r.status === 'IN_PROGRESS').map((r, i) => ({
              id: r.id,
              lng: [-71.9781, -71.9756, -71.9600, -71.9567, -71.9890][i % 5],
              lat: [-13.5167, -13.5156, -13.5222, -13.5278, -13.5345][i % 5],
              color: '#154212',
              icon: 'local_shipping' as const,
              label: r.name,
            }))}
            routes={data.routes.filter((r) => r.status === 'IN_PROGRESS').map((r, i) => ({
              id: r.id,
              color: ['#154212', '#2d5a27', '#1a6b3c', '#805533', '#493700'][i % 5],
              points: ([[-71.9781, -13.5167], [-71.9756, -13.5156], [-71.9600, -13.5222], [-71.9567, -13.5278], [-71.9890, -13.5345]] as [number, number][]).slice(0, (i % 3) + 2),
            }))}
            height="100%"
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-surface-dim">
            <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
              <div className="text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl">map</span>
                <p className="text-[14px] leading-[20px] mt-2">Cargando mapa de flota...</p>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-30">
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">remove</span>
          </button>
          <button className="w-12 h-12 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
          </button>
        </div>

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
              <div className="p-6 border-b border-outline-variant/30">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[24px] leading-[32px] font-bold text-on-surface">Flota Activa</h2>
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-extrabold uppercase tracking-widest">Live</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-primary text-white rounded-full text-[12px] font-bold cursor-pointer">Todos los Camiones</span>
                  {alertCount > 0 && (
                    <span className="px-3 py-1.5 bg-white border border-outline-variant text-on-surface-variant rounded-full text-[12px] font-bold hover:bg-surface-variant cursor-pointer transition-colors">
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
                  return (
                    <div
                      key={route.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm group ${
                        route.status === 'CANCELLED'
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
                            <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface">
                              {route.name}
                            </h3>
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
                        <span className={`flex items-center gap-1 ${
                          route.status === 'CANCELLED' ? 'text-error font-bold' : 'text-on-surface-variant'
                        }`}>
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
                        <span className={`${cfg.color} font-bold group-hover:underline`}>
                          {route.status === 'PENDING' ? 'Iniciar →' :
                           route.status === 'IN_PROGRESS' ? 'Rastrear →' :
                           route.status === 'COMPLETED' ? 'Ver →' :
                           'Resolver →'}
                        </span>
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
      </main>
    </div>
  );
}
