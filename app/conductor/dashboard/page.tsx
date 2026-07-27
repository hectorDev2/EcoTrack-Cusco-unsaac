'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api';
import DemoControls from '@/components/demo-controls';

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

const SHIFT_LABELS: Record<string, string> = {
  MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche', DOMINICAL: 'Dominical',
};

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  wasteType: { id: string; name: string; category: string };
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves', FRIDAY: 'Viernes', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
};

const WASTE_LABELS: Record<string, string> = {
  ORGANIC: 'Orgánico', RECYCLABLE: 'Reciclable', NON_RECYCLABLE: 'No Reciclable',
};

const WASTE_COLORS: Record<string, string> = {
  ORGANIC: 'bg-waste-organic/10 text-waste-organic border-waste-organic/20',
  RECYCLABLE: 'bg-waste-recyclable/10 text-waste-recyclable border-waste-recyclable/20',
  NON_RECYCLABLE: 'bg-waste-non-recyclable/10 text-waste-non-recyclable border-waste-non-recyclable/20',
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const router = useRouter();

  const fetchRoutes = () => {
    setLoading(true);
    api.get<DriverRoute[]>('/routes/my')
      .then(setRoutes)
      .catch((err) => setError(err.message ?? 'Error al cargar rutas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRoutes(); }, []);

  const activeRoute = routes.find((r) => r.status === 'IN_PROGRESS');
  const pendingRoute = routes.find((r) => r.status === 'PENDING');
  const todayRoute = activeRoute ?? pendingRoute;
  const routeZoneId = todayRoute?.zone?.id;
  const userZoneId = user?.zones?.[0]?.id;
  const schedulesZoneId = routeZoneId || userZoneId;

  useEffect(() => {
    if (!schedulesZoneId) { setSchedules([]); return; }
    setSchedulesLoading(true);
    api.get<Schedule[]>(`/schedules?zoneId=${schedulesZoneId}`)
      .then(setSchedules)
      .catch(() => {})
      .finally(() => setSchedulesLoading(false));
  }, [schedulesZoneId]);
  const progress = todayRoute && todayRoute.totalStops > 0
    ? Math.round((todayRoute.completedStops / todayRoute.totalStops) * 100) : 0;

  const handleStartRoute = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/routes/${id}/start`);
      fetchRoutes();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al iniciar ruta');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-bold">Cargando tu ruta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-status-alert text-sm">error</span>
          <p className="text-status-alert text-sm font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-status-alert">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {!todayRoute && (
        <div className="bg-surface-card rounded-2xl p-8 text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-5xl text-outline mb-4">route</span>
          <h2 className="text-[20px] font-bold text-on-surface mb-2">Sin rutas asignadas</h2>
          <p className="text-on-surface-variant text-sm">No tienes rutas pendientes por hoy.</p>
        </div>
      )}

      {todayRoute && (
        <>
          <div className="bg-surface-card rounded-2xl p-6 border border-outline-variant/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[12px] tracking-[0.08em] font-bold text-on-surface-variant uppercase mb-1">Ruta activa</p>
                <h2 className="text-[24px] font-extrabold text-primary">
                  {todayRoute.name ?? todayRoute.zone?.name ?? 'Sin zona'}
                </h2>
                <p className="text-[13px] text-on-surface-variant mt-0.5">
                  {todayRoute.zone?.name}
                  {todayRoute.shift ? ` · ${SHIFT_LABELS[todayRoute.shift] ?? todayRoute.shift}` : ''}
                  {todayRoute.frequency ? ` · ${todayRoute.frequency}` : ''}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                todayRoute.status === 'IN_PROGRESS'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {todayRoute.status === 'IN_PROGRESS' ? 'En curso' : 'Pendiente'}
              </span>
            </div>

            <div className="flex gap-6 mb-4">
              <div>
                <p className="text-[11px] text-on-surface-variant">Paradas</p>
                <p className="text-[24px] font-bold text-on-surface">
                  {todayRoute.completedStops}<span className="text-on-surface-variant text-[16px]">/{todayRoute.totalStops}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-on-surface-variant">Progreso</p>
                <p className="text-[24px] font-bold text-primary">{progress}%</p>
              </div>
            </div>

            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            {todayRoute.status === 'PENDING' && (
              <button
                onClick={() => handleStartRoute(todayRoute.id)}
                disabled={actionLoading === todayRoute.id}
                className="w-full bg-primary text-on-primary py-4 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
              >
                {actionLoading === todayRoute.id ? (
                  <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined">play_arrow</span>
                )}
                {actionLoading === todayRoute.id ? 'Iniciando...' : 'Iniciar Ruta'}
              </button>
            )}

            {todayRoute.status === 'IN_PROGRESS' && (
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/conductor/ruta')}
                  className="flex-1 bg-primary-container text-on-primary-container py-4 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
                >
                  <span className="material-symbols-outlined">list_alt</span>
                  Ver paradas
                </button>
                <button
                  onClick={() => router.push('/conductor/mapa')}
                  className="flex-1 bg-primary text-on-primary py-4 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
                >
                  <span className="material-symbols-outlined">map</span>
                  Ver mapa
                </button>
              </div>
            )}

            {todayRoute.status === 'IN_PROGRESS' && (
              <DemoControls routeId={todayRoute.id} />
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-[14px] font-bold text-on-surface-variant uppercase tracking-[0.08em]">
              Paradas {todayRoute.status === 'IN_PROGRESS' ? 'pendientes' : 'programadas'}
            </h3>
            {todayRoute.stops
              .filter((s) => todayRoute.status === 'PENDING' || s.status === 'PENDING')
              .slice(0, 3)
              .map((stop) => (
                <div key={stop.id} className="bg-surface-card rounded-xl p-4 border border-outline-variant/20 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-on-surface truncate">{stop.pickupPoint.name}</p>
                    <p className="text-[12px] text-on-surface-variant truncate">{stop.pickupPoint.address}</p>
                  </div>
                  <span className="text-[11px] font-bold text-outline">#{stop.orderIndex + 1}</span>
                </div>
              ))}
            {todayRoute.stops.filter((s) => todayRoute.status === 'PENDING' || s.status === 'PENDING').length === 0 && (
              <p className="text-center text-on-surface-variant text-sm py-4">
                {todayRoute.status === 'IN_PROGRESS' ? '¡Todas las paradas completadas!' : 'Sin paradas programadas'}
              </p>
            )}
          </div>

          {todayRoute.status === 'IN_PROGRESS' && todayRoute.completedStops > 0 && (
            <div>
              <h3 className="text-[14px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-3">Completadas</h3>
              {todayRoute.stops.filter((s) => s.status === 'COMPLETED').map((stop) => (
                <div key={stop.id} className="bg-surface-card rounded-xl p-4 border border-waste-organic/20 flex items-center gap-4 opacity-70">
                  <div className="w-8 h-8 rounded-full bg-waste-organic/10 flex items-center justify-center text-waste-organic flex-shrink-0">
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
        </>
      )}

      {schedules.length > 0 && (
        <div className="bg-surface-card rounded-xl p-5 border border-outline-variant/20">
          <h3 className="text-[14px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-3">
            Horarios de recolección
          </h3>
          {schedulesLoading ? (
            <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Cargando horarios...
            </div>
          ) : (
            <div className="space-y-2">
              {schedules
                .slice()
                .sort((a, b) => {
                  const order = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                  const ia = order.indexOf(a.dayOfWeek);
                  const ib = order.indexOf(b.dayOfWeek);
                  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.startTime.localeCompare(b.startTime);
                })
                .map((s) => (
                  <div key={s.id} className="flex items-center gap-3 text-[13px]">
                    <span className="w-14 font-bold text-on-surface flex-shrink-0">{DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}</span>
                    <span className="text-on-surface-variant">{s.startTime} - {s.endTime}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold border ${WASTE_COLORS[s.wasteType.category] ?? ''}`}>
                      {WASTE_LABELS[s.wasteType.category] ?? s.wasteType.name}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {routes.length > 1 && (
        <div className="bg-surface-container-low rounded-xl p-4">
          <p className="text-[11px] font-bold text-on-surface-variant">Tienes {routes.length} rutas asignadas</p>
        </div>
      )}
    </div>
  );
}
