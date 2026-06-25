'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQueries, useQuery } from '@tanstack/react-query';
import { queries } from '@/lib/queries';
import type { CollectionSchedule } from '@/lib/types';

const dayMap: Record<string, string> = {
  SUNDAY: 'Domingo', MONDAY: 'Lunes', TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles', THURSDAY: 'Jueves', FRIDAY: 'Viernes', SATURDAY: 'Sábado',
};

const wasteIcons: Record<string, string> = {
  ORGANIC: 'eco', RECYCLABLE: 'recycling', NON_RECYCLABLE: 'delete', HAZARDOUS: 'warning',
};

const wasteColors: Record<string, string> = {
  ORGANIC: 'bg-waste-organic text-white',
  RECYCLABLE: 'bg-waste-recyclable text-white',
  NON_RECYCLABLE: 'bg-waste-non-recyclable text-white',
  HAZARDOUS: 'bg-status-alert text-white',
};

const _wasteLabels: Record<string, string> = {
  ORGANIC: 'Orgánico', RECYCLABLE: 'Reciclable', NON_RECYCLABLE: 'No Reciclable', HAZARDOUS: 'Peligroso',
};

const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesUntil(targetDay: string, startTime: string): number {
  const now = new Date();
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayIdx = now.getDay();
  const targetIdx = daysOfWeek.indexOf(targetDay);
  let daysDiff = targetIdx - todayIdx;
  if (daysDiff < 0 || (daysDiff === 0 && parseTime(startTime) <= now.getHours() * 60 + now.getMinutes())) {
    daysDiff += 7;
  }
  return daysDiff * 24 * 60 + parseTime(startTime) - (now.getHours() * 60 + now.getMinutes());
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function InicioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const zoneIds = user?.zones?.map((z) => z.id) ?? [];

  const scheduleQueries = zoneIds.map((zid) =>
    queries.schedules.all(zid),
  );
  const ppQueries = zoneIds.map((zid) =>
    queries.pickupPoints.all(zid),
  );

  const scheduleResults = useQueries({ queries: scheduleQueries });
  const ppResults = useQueries({ queries: ppQueries });
  const { data: myIncidents } = useQuery({
    ...queries.incidents.my(),
    enabled: !!user,
  });

  const schedules = scheduleResults.flatMap((q) => {
    const data = q.data;
    if (data && 'data' in data) return data.data as CollectionSchedule[];
    return [];
  });
  const ppCount = ppResults.reduce((sum, q) => {
    const data = q.data;
    if (Array.isArray(data)) return sum + data.length;
    return sum;
  }, 0);
  const openCount = (myIncidents ?? []).filter((i) => i.status === 'OPEN').length;
  const loading = scheduleResults.some((q) => q.isLoading) || ppResults.some((q) => q.isLoading);

  // Next schedule
  const nextSchedule = schedules
    .map((s) => ({ s, mins: minutesUntil(s.dayOfWeek, s.startTime) }))
    .filter((s) => s.mins > 0)
    .sort((a, b) => a.mins - b.mins)[0];

  // Today's schedule
  const todaySchedules = schedules.filter((s) => s.dayOfWeek === todayDay);
  const todaySchedule = todaySchedules.length > 0 ? todaySchedules[0] : null;

  const firstName = user?.fullName?.split(' ')[0] ?? 'Ciudadano';
  const zoneNames = user?.zones?.map((z) => z.name).join(', ') ?? '';
  const _showWarning = openCount > 0;

  return (
    <>
      <header className="bg-surface shadow-sm shadow-primary/10 flex justify-between items-center w-full px-5 py-2 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform duration-200">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-[20px] leading-[28px] font-black text-primary">Eco Track Wanchaq</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant hidden md:block">
            {zoneNames || 'Cusco, PE'}
          </span>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed ring-2 ring-primary-container/10 bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
            <span className="text-[14px] font-bold">{firstName.charAt(0)}</span>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6 space-y-6 max-w-2xl mx-auto pb-32">
        <section className="space-y-1 animate-fade-in-up stagger-1">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
            ¡Hola, {firstName}!
          </h2>
          <p className="text-[16px] leading-[24px] text-on-surface-variant">
            Mantengamos juntos la pureza de nuestra ciudad imperial.
          </p>
        </section>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && nextSchedule && (
          <div className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary-container shadow-xl shadow-primary/20 flex flex-col gap-4 border border-white/10 active:scale-95 transition-transform duration-200 cursor-pointer animate-fade-in-up stagger-2">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold uppercase opacity-80">
                  {nextSchedule.mins < 1440 ? 'Hoy' : dayMap[nextSchedule.s.dayOfWeek]} — Siguiente Recolección
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[48px] leading-none font-extrabold tracking-tight">
                    {formatTime(nextSchedule.s.startTime)}
                  </span>
                </div>
              </div>
              <div className="bg-primary/20 backdrop-blur-md rounded-lg p-2 border border-white/20">
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_shipping
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-1 ${wasteColors[nextSchedule.s.wasteType?.category ?? ''] ?? 'bg-primary/20'} px-3 py-1.5 rounded-full shadow-lg`}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {wasteIcons[nextSchedule.s.wasteType?.category ?? ''] ?? 'delete'}
                </span>
                <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                  {nextSchedule.s.wasteType?.name ?? 'General'}
                </span>
              </div>
              <div className="flex-1 h-[2px] bg-white/20 rounded-full" />
              <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold whitespace-nowrap">
                {nextSchedule.s.zone?.name ?? ''} · {formatMinutes(nextSchedule.mins)}
              </span>
            </div>
          </div>
        )}

        {!loading && !nextSchedule && schedules.length === 0 && (
          <div className="bg-surface-container-low rounded-xl p-6 text-center border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">schedule</span>
            <p className="text-on-surface-variant text-sm">No hay horarios disponibles para tus zonas.</p>
          </div>
        )}

        {todaySchedule && (
          <section className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 animate-fade-in-up stagger-3">
            <div className="flex gap-4 items-start">
              <div className={`p-2 rounded-lg ${wasteColors[todaySchedule.wasteType?.category ?? ''] ?? 'bg-primary/10'}`}>
                <span className="material-symbols-outlined">{wasteIcons[todaySchedule.wasteType?.category ?? ''] ?? 'delete'}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary">
                  Hoy: {todaySchedule.wasteType?.name ?? 'Recolección'}
                </h3>
                <p className="text-[14px] leading-[20px] text-on-surface-variant">
                  Horario: {formatTime(todaySchedule.startTime)} — {formatTime(todaySchedule.endTime)}
                  {todaySchedule.zone && <> · Zona: {todaySchedule.zone.name}</>}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Quick actions */}
        <section className="grid grid-cols-2 gap-4 animate-fade-in-up stagger-4">
          <button onClick={() => router.push('/recoleccion')}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">Horarios</span>
          </button>
          <button onClick={() => router.push('/puntos-recojo')}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">Puntos de Recojo</span>
          </button>
          <button onClick={() => router.push('/reportar')}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200 relative">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">report_problem</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">Reportar</span>
            {openCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-status-alert rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg">
                {openCount}
              </span>
            )}
          </button>
          <button onClick={() => router.push('/perfil')}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">Mi Perfil</span>
          </button>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-5">
          <div className="bg-surface-card rounded-xl p-4 border border-outline-variant/20 text-center">
            <p className="text-[24px] leading-[32px] font-bold text-primary">{ppCount}</p>
            <p className="text-[11px] text-on-surface-variant">Puntos de recojo</p>
          </div>
          <div className="bg-surface-card rounded-xl p-4 border border-outline-variant/20 text-center">
            <p className="text-[24px] leading-[32px] font-bold text-primary">{schedules.length}</p>
            <p className="text-[11px] text-on-surface-variant">Horarios disponibles</p>
          </div>
        </div>

        {/* Incidencias activas */}
        {openCount > 0 && (
          <section className="bg-status-alert/5 rounded-xl p-4 border border-status-alert/20 animate-fade-in-up stagger-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-alert">warning</span>
              <div>
                <p className="text-[13px] font-bold text-on-surface">
                  Tienes {openCount} incidencia{openCount > 1 ? 's' : ''} pendiente{openCount > 1 ? 's' : ''}
                </p>
                <button onClick={() => router.push('/incidencias')}
                  className="text-[12px] text-primary font-bold hover:underline mt-1 inline-block">
                  Ver mis incidencias
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
