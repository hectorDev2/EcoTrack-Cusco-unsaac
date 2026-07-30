'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queries } from '@/lib/queries';
import { useAuth } from '@/lib/auth-context';
import MapView, { type MapMarker } from '@/components/map-view';
import type { PickupPoint, ActiveRoute, CitizenAlarm } from '@/lib/types';

const DAY_LABELS: Record<string, string> = {
  MON: 'Lunes', TUE: 'Martes', WED: 'Miércoles', THU: 'Jueves',
  FRI: 'Viernes', SAT: 'Sábado', SUN: 'Domingo',
};

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Días en que corre cada frecuencia del rutero (ver backend FrequencyCode).
// Si una ruta no tiene frequency asignada, se asume que corre todos los días.
const FREQUENCY_DAYS: Record<string, string[]> = {
  LMV: ['MON', 'WED', 'FRI'],
  MJS: ['TUE', 'THU', 'SAT'],
  DOM: ['SUN'],
  DOM_LUN: ['SUN', 'MON'],
  TODOS: DAY_ORDER,
};

function routeRunsOnDay(frequency: string | null | undefined, day: string): boolean {
  if (!frequency) return true;
  const days = FREQUENCY_DAYS[frequency];
  return days ? days.includes(day) : true;
}

function haversineKm(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const JS_DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
function todayCode(): string {
  return JS_DAY_CODES[new Date().getDay()];
}

const TIME_OPTIONS = [
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
  { value: 45, label: '45 min antes' },
  { value: 60, label: '1 hora antes' },
];

interface LocationOption {
  key: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  pointIds: string[];
}

// Varios registros de PickupPoint comparten la misma ubicación física
// (un turno/horario distinto cada uno). Se agrupan por coordenada.
function dedupeLocations(points: PickupPoint[]): LocationOption[] {
  const map = new Map<string, LocationOption>();
  for (const p of points) {
    const key = `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`;
    const existing = map.get(key);
    if (existing) {
      existing.pointIds.push(p.id);
    } else {
      map.set(key, {
        key,
        name: p.name,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        pointIds: [p.id],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

interface RouteCandidate {
  routeId: string;
  routeName: string;
  zoneName: string;
  pickupPointId: string;
  scheduledTime: string | null;
}

function findCandidates(routes: ActiveRoute[], location: LocationOption, days: string[]): RouteCandidate[] {
  const idSet = new Set(location.pointIds);
  const results: RouteCandidate[] = [];
  for (const route of routes) {
    if (!days.some((d) => routeRunsOnDay(route.frequency, d))) continue;
    for (const stop of route.stops) {
      if (!idSet.has(stop.pickupPoint.id)) continue;
      results.push({
        routeId: route.id,
        routeName: route.name ?? route.zone.name,
        zoneName: route.zone.name,
        pickupPointId: stop.pickupPoint.id,
        scheduledTime: stop.pickupPoint.scheduledTime ?? null,
      });
    }
  }
  return results.sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99'));
}

// Pide permiso y dispara Notification del navegador cuando una alarma activa
// entra en su ventana de aviso (scheduledTime - notifyBeforeMinutes), una vez
// por día por alarma (dedupe en localStorage).
function useBrowserAlarmNotifications(alarms: CitizenAlarm[]) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    Notification.requestPermission().then(setPermission).catch(() => {});
  };

  useEffect(() => {
    if (permission !== 'granted' || alarms.length === 0) return;

    const check = () => {
      const now = new Date();
      const day = todayCode();
      const dateStr = now.toISOString().slice(0, 10);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      for (const alarm of alarms) {
        const time = alarm.pickupPoint.scheduledTime;
        if (!time) continue;
        if (!routeRunsOnDay(alarm.route.frequency, day)) continue;

        const match = /^(\d{1,2}):(\d{2})$/.exec(time);
        if (!match) continue;
        const scheduledMinutes = Number(match[1]) * 60 + Number(match[2]);
        const triggerMinutes = scheduledMinutes - alarm.notifyBeforeMinutes;
        if (nowMinutes < triggerMinutes || nowMinutes > scheduledMinutes) continue;

        const dedupeKey = `alarm-notified:${alarm.id}:${dateStr}`;
        if (localStorage.getItem(dedupeKey)) continue;

        new Notification('Eco Track Wanchaq', {
          body: `El camión pasará por "${alarm.pickupPoint.name}" en aprox. ${alarm.notifyBeforeMinutes} min (hora estimada ${time}).`,
          icon: '/favicon.ico',
        });
        localStorage.setItem(dedupeKey, '1');
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [permission, alarms]);

  return { permission, requestPermission };
}

export default function AlarmasPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [locationKey, setLocationKey] = useState<string | null>(null);
  const [clickedPoint, setClickedPoint] = useState<{ lng: number; lat: number } | null>(null);
  const [candidate, setCandidate] = useState<RouteCandidate | null>(null);
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState(30);
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: allRoutes = [] } = useQuery(queries.routes.forAlarms());
  const { data: allPoints = [] } = useQuery(queries.pickupPoints.all());

  const myZoneIds = new Set(user?.zones?.map((z) => z.id) ?? []);
  const routes = myZoneIds.size > 0 ? allRoutes.filter((r) => myZoneIds.has(r.zone.id)) : allRoutes;
  const zonePoints = myZoneIds.size > 0 ? allPoints.filter((p) => myZoneIds.has(p.zoneId)) : allPoints;

  // Solo se ofrecen puntos que pertenecen a alguna ruta. Los vertederos
  // "libres" (sin ruta) no sirven para una alarma —no habría ruta candidata y
  // el botón quedaría deshabilitado—, así que se descartan del selector/mapa.
  const routePointIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of routes) for (const st of r.stops) s.add(st.pickupPoint.id);
    return s;
  }, [routes]);
  const points = useMemo(
    () => zonePoints.filter((p) => routePointIds.has(p.id)),
    [zonePoints, routePointIds],
  );

  const locations = useMemo(() => dedupeLocations(points), [points]);
  const filteredLocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q),
    );
  }, [locations, search]);

  const selectedLocation = locations.find((l) => l.key === locationKey) ?? null;

  // Los 4 vertederos más cercanos al punto que el usuario tocó en el mapa
  // (mismo comportamiento que en /mapa).
  const nearestKeys = useMemo(() => {
    if (!clickedPoint) return new Set<string>();
    const withDist = locations.map((l) => ({
      key: l.key,
      dist: haversineKm(clickedPoint.lng, clickedPoint.lat, l.longitude, l.latitude),
    }));
    withDist.sort((a, b) => a.dist - b.dist);
    return new Set(withDist.slice(0, 4).map((x) => x.key));
  }, [locations, clickedPoint]);

  const candidates = useMemo(() => {
    if (days.length === 0 || !selectedLocation) return [];
    return findCandidates(routes, selectedLocation, days);
  }, [routes, days, selectedLocation]);

  const { data: alarms = [], isLoading } = useQuery({
    ...queries.citizenAlarms.mine(),
    refetchInterval: 15000,
  });

  const { permission, requestPermission } = useBrowserAlarmNotifications(alarms);

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<CitizenAlarm>('/citizen-alarms', {
        routeId: candidate!.routeId,
        pickupPointId: candidate!.pickupPointId,
        notifyBeforeMinutes,
        label: label || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queries.citizenAlarms.mine().queryKey });
      resetForm();
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Error al crear alarma');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/citizen-alarms/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queries.citizenAlarms.mine().queryKey }),
  });

  const [editingAlarm, setEditingAlarm] = useState<CitizenAlarm | null>(null);
  const [editMinutes, setEditMinutes] = useState(30);
  const [editLabel, setEditLabel] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  function openEdit(alarm: CitizenAlarm) {
    setEditingAlarm(alarm);
    setEditMinutes(alarm.notifyBeforeMinutes);
    setEditLabel(alarm.label ?? '');
    setEditError(null);
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch<CitizenAlarm>(`/citizen-alarms/${editingAlarm!.id}`, {
        notifyBeforeMinutes: editMinutes,
        label: editLabel || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queries.citizenAlarms.mine().queryKey });
      setEditingAlarm(null);
    },
    onError: (err: unknown) => {
      setEditError(err instanceof Error ? err.message : 'Error al actualizar');
    },
  });

  function toggleDay(d: string) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
    setCandidate(null);
  }

  function resetForm() {
    setShowForm(false);
    setDays([]);
    setSearch('');
    setLocationKey(null);
    setClickedPoint(null);
    setCandidate(null);
    setNotifyBeforeMinutes(30);
    setLabel('');
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidate) { setFormError('Selecciona una ruta'); return; }
    createMutation.mutate();
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[24px] leading-[32px] font-extrabold text-primary">Alarmas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-primary text-on-primary px-3 py-2 rounded-xl text-[13px] font-bold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add_alert</span>
          Nueva alarma
        </button>
      </div>
      <p className="text-[14px] text-on-surface-variant mb-3">
        Recibe notificaciones antes de que el camión pase por tu punto de recojo.
      </p>

      {permission !== 'unsupported' && permission !== 'granted' && (
        <button
          onClick={requestPermission}
          className="w-full flex items-center gap-2 bg-primary-container/30 text-primary px-4 py-3 rounded-xl text-[13px] font-bold mb-4 hover:bg-primary-container/50 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">notifications_active</span>
          Activar notificaciones del navegador
        </button>
      )}

      {!user?.phone && (
        <div className="flex items-start gap-2 bg-surface-container-high rounded-xl p-3 mb-6 text-[12px] text-on-surface-variant">
          <span className="material-symbols-outlined text-sm text-primary">info</span>
          <span>
            No tienes un número de WhatsApp registrado. Agrégalo en tu{' '}
            <a href="/perfil" className="text-primary font-bold underline">perfil</a>{' '}
            para recibir el aviso también por WhatsApp.
          </span>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-auto p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-on-surface">Nueva alarma</h3>
              <button
                onClick={resetForm}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1.5">
                  1. Día(s) <span className="normal-case font-normal">(puedes elegir varios)</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DAY_ORDER.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`py-2 rounded-lg text-[11px] font-bold transition-colors ${
                        days.includes(d)
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10'
                      }`}
                    >
                      {DAY_LABELS[d].slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {days.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1.5">
                    2. Punto de recojo <span className="normal-case font-normal">(toca un tacho en el mapa)</span>
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setLocationKey(null); setCandidate(null); }}
                    placeholder="Buscar por nombre o dirección..."
                    className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary mb-2"
                  />
                  <div className="rounded-xl border border-outline-variant/20 overflow-hidden">
                    <MapView
                      height="220px"
                      markers={[
                        ...filteredLocations.map((loc): MapMarker => ({
                          id: loc.key,
                          lng: loc.longitude,
                          lat: loc.latitude,
                          color: locationKey === loc.key
                            ? '#E8A317'
                            : nearestKeys.has(loc.key)
                              ? '#8BC34A'
                              : '#2d5a27',
                          icon: 'delete',
                          hideLabel: true,
                        })),
                        ...(clickedPoint ? [{
                          id: 'clicked-origin',
                          lng: clickedPoint.lng,
                          lat: clickedPoint.lat,
                          color: '#154212',
                          icon: 'location_on',
                          label: 'Punto elegido',
                        } as MapMarker] : []),
                      ]}
                      onMarkerClick={(m) => {
                        if (m.id === 'clicked-origin') return;
                        setLocationKey(m.id);
                        setCandidate(null);
                      }}
                      onMapClick={(lng, lat) => setClickedPoint({ lng, lat })}
                    />
                  </div>
                  {clickedPoint && (
                    <p className="text-[11px] text-on-surface-variant mt-1.5">
                      Vertederos en verde claro = los 4 más cercanos al punto que tocaste.
                    </p>
                  )}
                  {filteredLocations.length === 0 && (
                    <p className="text-[12px] text-on-surface-variant mt-2">Sin resultados para esa búsqueda</p>
                  )}
                  {selectedLocation && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-primary/10 text-[12px]">
                      <p className="font-bold text-primary truncate">{selectedLocation.name}</p>
                      <p className="text-on-surface-variant truncate">{selectedLocation.address}</p>
                    </div>
                  )}
                </div>
              )}

              {days.length > 0 && selectedLocation && (
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1.5">
                    3. Ruta ({days.map((d) => DAY_LABELS[d]).join(', ')})
                  </label>
                  {candidates.length === 0 ? (
                    <p className="text-[12px] text-on-surface-variant bg-surface-container-high rounded-xl p-3">
                      No hay rutas registradas que pasen por este punto los días seleccionados.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {candidates.map((c, i) => (
                        <button
                          key={`${c.routeId}-${c.pickupPointId}-${i}`}
                          type="button"
                          onClick={() => setCandidate(c)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                            candidate === c
                              ? 'border-primary bg-primary/10'
                              : 'border-outline-variant/30 hover:bg-surface-container-high'
                          }`}
                        >
                          <span className="text-[13px] font-black text-primary w-12 flex-shrink-0">
                            {c.scheduledTime ?? '--:--'}
                          </span>
                          <span className="min-w-0">
                            <p className="text-[12px] font-bold text-on-surface truncate">{c.routeName}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">{c.zoneName}</p>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {candidate && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                      Notificar
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIME_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNotifyBeforeMinutes(opt.value)}
                          className={`py-3 rounded-xl text-[12px] font-bold transition-colors ${
                            notifyBeforeMinutes === opt.value
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                      Etiqueta <span className="normal-case font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Ej: Casa, Trabajo..."
                      className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {formError && (
                <p className="text-status-alert text-[12px]">{formError}</p>
              )}

              <button
                type="submit"
                disabled={createMutation.isPending || !candidate}
                className="bg-primary text-on-primary px-4 py-3 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {createMutation.isPending ? 'Guardando...' : 'Guardar alarma'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alarms.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-8 text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-5xl text-outline mb-4">add_alert</span>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">Sin alarmas</h2>
          <p className="text-on-surface-variant text-sm">
            Crea alarmas para que te notifiquemos antes de que el camión pase por tu punto de recojo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alarms.map((alarm) => {
            const timeLabel = TIME_OPTIONS.find((t) => t.value === alarm.notifyBeforeMinutes)?.label ?? `${alarm.notifyBeforeMinutes} min antes`;
            const inProgress = alarm.route.status === 'IN_PROGRESS';
            return (
              <div key={alarm.id} className="bg-surface-card rounded-xl border border-outline-variant/20 flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">notifications_active</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-on-surface truncate">
                      {alarm.label ?? alarm.pickupPoint.name}
                    </p>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${
                        inProgress
                          ? 'bg-status-alert/15 text-status-alert'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {inProgress ? '● En curso' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant truncate">
                    {alarm.pickupPoint.address}
                    {alarm.route.name && <span> · {alarm.route.name}</span>}
                    {alarm.pickupPoint.scheduledTime && <span> · {alarm.pickupPoint.scheduledTime}</span>}
                    <span> · {timeLabel}</span>
                  </p>
                </div>
                <button
                  onClick={() => openEdit(alarm)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => deleteMutation.mutate(alarm.id)}
                  disabled={deleteMutation.isPending}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-status-alert/10 text-on-surface-variant hover:text-status-alert transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-auto p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-on-surface">Editar alarma</h3>
              <button
                onClick={() => setEditingAlarm(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="px-3 py-2 rounded-lg bg-surface-container-high text-[12px]">
              <p className="font-bold text-on-surface">{editingAlarm.pickupPoint.name}</p>
              <p className="text-on-surface-variant">
                {editingAlarm.pickupPoint.address}
                {editingAlarm.route.name && <span> · {editingAlarm.route.name}</span>}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                Notificar
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditMinutes(opt.value)}
                    className={`py-3 rounded-xl text-[12px] font-bold transition-colors ${
                      editMinutes === opt.value
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                Etiqueta <span className="normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Ej: Casa, Trabajo..."
                className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {editError && <p className="text-status-alert text-[12px]">{editError}</p>}

            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="bg-primary text-on-primary px-4 py-3 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
