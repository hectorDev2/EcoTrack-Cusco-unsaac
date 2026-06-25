'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queries';
import type { Incident } from '@/lib/types';

interface DashboardData {
  zones: number;
  pickupPoints: number;
  coverage: number;
  incidentsByStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  pendingIncidents: number;
  recentIncidents: (Incident & { reporter: { fullName: string } })[];
  usersStats: {
    total: number;
    active: number;
    drivers: number;
    admins: number;
    citizens: number;
  };
  schedulesCount: number;
}

const statusConfig: Record<string, { label: string; style: string }> = {
  OPEN: { label: 'Abierto', style: 'bg-surface-container-highest text-on-surface-variant' },
  IN_PROGRESS: { label: 'Procesando', style: 'bg-secondary-container text-on-secondary-container' },
  RESOLVED: { label: 'Resuelto', style: 'bg-primary-container text-on-primary-container' },
  CLOSED: { label: 'Cerrado', style: 'bg-surface-variant text-on-surface-variant' },
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboardPage() {
  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => api.get<DashboardData>('/admin/dashboard'),
  });

  const error = queryError ? (queryError as { message?: string }).message ?? 'Error al cargar dashboard' : null;

  return (
    <>
      <header className="flex justify-between items-center w-full px-6 py-2 sticky top-0 z-10 bg-surface border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-8 flex-1">
          <h2 className="text-[24px] leading-[32px] font-bold text-primary">
            Panel de Administración
          </h2>
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/20 text-[16px] leading-[24px]"
              placeholder="Buscar rutas, camiones o incidencias..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6 ml-lg">
          <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            {data && data.pendingIncidents > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-alert rounded-full" />
            )}
          </button>
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">help</span>
          </button>
          <div className="flex items-center gap-3 pl-lg border-l border-outline-variant/30">
            <div className="text-right hidden xl:block">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface leading-none">
                Admin Cusco
              </p>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">
                Gestión Municipal
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary-fixed bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-[1440px] mx-auto space-y-lg">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h3 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-on-surface">
              Bienvenido, Eco Track Cusco
            </h3>
            <p className="text-[16px] leading-[24px] text-on-surface-variant mt-2">
              Resumen operativo para el sector Cusco Metropolitano.
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold active:scale-95 transition-transform"
            onClick={() => window.location.reload()}
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Actualizar
          </button>
        </section>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-on-surface-variant text-sm font-bold">Cargando dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert">error</span>
            <p className="text-status-alert text-sm font-bold">{error}</p>
          </div>
        )}

        {data && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                  </div>
                  <span className={`text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-1 ${data.coverage >= 70 ? 'text-waste-organic' : 'text-status-alert'}`}>
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    {data.coverage}%
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[16px] leading-[24px] text-on-surface-variant">Cobertura de Recolección</p>
                  <h4 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary mt-1">
                    {data.coverage}%
                  </h4>
                </div>
                <div className="mt-4 flex items-center gap-4 text-[14px] leading-[20px] text-on-surface-variant">
                  <span>{data.zones} zonas activas</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant" />
                  <span>{data.pickupPoints} puntos de recojo</span>
                </div>
                <div className="mt-4 w-full bg-surface-container rounded-full h-1.5">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(data.coverage, 100)}%` }} />
                </div>
              </div>

              <div className="bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-status-alert/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="flex items-start justify-between">
                  <div className="bg-status-alert/10 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-status-alert" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                  <span className={`text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-1 ${data.pendingIncidents > 0 ? 'text-status-alert' : 'text-waste-organic'}`}>
                    <span className="material-symbols-outlined text-[16px]">priority_high</span>
                    {data.pendingIncidents > 0 ? 'Crítico' : 'Sin novedades'}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[16px] leading-[24px] text-on-surface-variant">Incidencias Pendientes</p>
                  <h4 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-on-surface mt-1">{data.pendingIncidents}</h4>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-status-alert/10 text-status-alert rounded-full text-[11px] font-bold">{data.incidentsByStatus.open} abiertas</span>
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold">{data.incidentsByStatus.inProgress} en progreso</span>
                </div>
              </div>

              <div className="bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <div className="flex items-start justify-between">
                  <div className="bg-secondary/10 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  </div>
                  <span className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.05em] font-bold">{data.usersStats.active} activos</span>
                </div>
                <div className="mt-4">
                  <p className="text-[16px] leading-[24px] text-on-surface-variant">Usuarios del Sistema</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <h4 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-on-surface">{data.usersStats.total}</h4>
                    <span className="text-on-surface-variant text-[16px] leading-[24px]">usuarios</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold">{data.usersStats.admins} admins</span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[11px] font-bold">{data.usersStats.drivers} conductores</span>
                  <span className="px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-[11px] font-bold">{data.usersStats.citizens} ciudadanos</span>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h5 className="text-[24px] leading-[32px] font-bold text-on-surface">Resumen por Zona</h5>
                    <p className="text-[14px] leading-[20px] text-on-surface-variant">Distribución de cobertura por distrito</p>
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-8 pt-6 relative">
                  <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                    <div className="border-b border-on-surface" />
                    <div className="border-b border-on-surface" />
                    <div className="border-b border-on-surface" />
                    <div className="border-b border-on-surface" />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-primary-container rounded-t-lg transition-all duration-500 group-hover:bg-primary" style={{ height: '85%' }} />
                    <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">C. Histórico</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-primary-container rounded-t-lg transition-all duration-500 group-hover:bg-primary" style={{ height: '60%' }} />
                    <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">San Blas</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-primary-container rounded-t-lg transition-all duration-500 group-hover:bg-primary" style={{ height: '95%' }} />
                    <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">San Sebas</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-primary-container rounded-t-lg transition-all duration-500 group-hover:bg-primary" style={{ height: '40%' }} />
                    <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">Santiago</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-primary-container rounded-t-lg transition-all duration-500 group-hover:bg-primary" style={{ height: '75%' }} />
                    <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">Wanchaq</span>
                  </div>
                </div>
                <p className="text-center text-[12px] text-on-surface-variant mt-4">
                  {data.schedulesCount} horarios activos · {data.pickupPoints} puntos de recojo · {data.zones} zonas
                </p>
              </div>

              <div className="lg:col-span-4 bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col">
                <div className="mb-6">
                  <h5 className="text-[24px] leading-[32px] font-bold text-on-surface">Actividad Reciente</h5>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">Últimas incidencias reportadas</p>
                </div>
                <div className="space-y-md overflow-y-auto max-h-[320px] pr-2">
                  {data.recentIncidents.length === 0 && (
                    <p className="text-on-surface-variant text-center py-8 text-[14px]">No hay incidencias recientes</p>
                  )}
                  {data.recentIncidents.map((inc) => (
                    <div key={inc.id} className="flex gap-4 p-4 hover:bg-surface-container rounded-xl transition-colors cursor-pointer group">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          {inc.type === 'CONTAINER_DAMAGED' ? 'delete' : inc.type === 'ILLEGAL_DUMPING' ? 'gavel' : inc.type === 'MISSED_COLLECTION' ? 'schedule' : 'help'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h6 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface truncate">
                            {inc.type === 'CONTAINER_DAMAGED' ? 'Contenedor Dañado' : inc.type === 'ILLEGAL_DUMPING' ? 'Vertido Ilegal' : inc.type === 'MISSED_COLLECTION' ? 'Recolección Perdida' : 'Otro'}
                          </h6>
                          <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{getTimeAgo(inc.createdAt)}</span>
                        </div>
                        <p className="text-[14px] leading-[20px] text-on-surface-variant line-clamp-1">{inc.zone?.name ?? 'Sin zona'}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${statusConfig[inc.status]?.style ?? ''}`}>
                            {statusConfig[inc.status]?.label ?? inc.status}
                          </span>
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-surface-container-highest text-on-surface-variant">
                            {inc.reporter?.fullName ?? 'Anónimo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
