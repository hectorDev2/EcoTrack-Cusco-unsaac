'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queries } from '@/lib/queries';
import { useAuth } from '@/lib/auth-context';

interface CitizenAlarm {
  id: string;
  routeId: string;
  pickupPointId: string;
  notifyBeforeMinutes: number;
  label: string | null;
  active: boolean;
  createdAt: string;
  route: { id: string; name: string };
  pickupPoint: { id: string; name: string; address: string };
}

const TIME_OPTIONS = [
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
  { value: 45, label: '45 min antes' },
  { value: 60, label: '1 hora antes' },
];

export default function AlarmasPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    routeId: '',
    pickupPointId: '',
    notifyBeforeMinutes: 30,
    label: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: allRoutes = [] } = useQuery(queries.routes.active());

  const myZoneIds = new Set(user?.zones?.map((z) => z.id) ?? []);
  const routes = myZoneIds.size > 0
    ? allRoutes.filter((r) => myZoneIds.has(r.zone.id))
    : allRoutes;

  const selectedRoute = routes.find((r) => r.id === form.routeId);

  const { data: alarms = [], isLoading } = useQuery<CitizenAlarm[]>({
    queryKey: ['citizen-alarms'],
    queryFn: () => api.get<CitizenAlarm[]>('/citizen-alarms'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post<CitizenAlarm>('/citizen-alarms', {
        routeId: data.routeId,
        pickupPointId: data.pickupPointId,
        notifyBeforeMinutes: data.notifyBeforeMinutes,
        label: data.label || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['citizen-alarms'] });
      setShowForm(false);
      setForm({ routeId: '', pickupPointId: '', notifyBeforeMinutes: 30, label: '' });
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Error al crear alarma');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/citizen-alarms/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['citizen-alarms'] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.routeId) { setFormError('Selecciona una ruta'); return; }
    if (!form.pickupPointId) { setFormError('Selecciona un punto de recojo'); return; }
    createMutation.mutate(form);
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
      <p className="text-[14px] text-on-surface-variant mb-6">
        Recibe notificaciones antes de que el camión pase por tu punto de recojo.
      </p>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-on-surface">Nueva alarma</h3>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                  Ruta
                </label>
                <select
                  value={form.routeId}
                  onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value, pickupPointId: '' }))}
                  className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecciona una ruta</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name ?? r.zone.name} — {r.zone.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoute && (
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                    Punto de recojo
                  </label>
                  <select
                    value={form.pickupPointId}
                    onChange={(e) => setForm((f) => ({ ...f, pickupPointId: e.target.value }))}
                    className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecciona un punto</option>
                    {selectedRoute.stops
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((s) => (
                        <option key={s.id} value={s.pickupPoint.id}>
                          #{s.orderIndex + 1} {s.pickupPoint.name} — {s.pickupPoint.address}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                  Notificar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, notifyBeforeMinutes: opt.value }))}
                      className={`py-3 rounded-xl text-[12px] font-bold transition-colors ${
                        form.notifyBeforeMinutes === opt.value
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
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ej: Casa, Trabajo..."
                  className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {formError && (
                <p className="text-status-alert text-[12px]">{formError}</p>
              )}

              <button
                type="submit"
                disabled={createMutation.isPending || !form.pickupPointId}
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
            return (
              <div key={alarm.id} className="bg-surface-card rounded-xl border border-outline-variant/20 flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">notifications_active</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface truncate">
                    {alarm.label ?? alarm.pickupPoint.name}
                  </p>
                  <p className="text-[12px] text-on-surface-variant">
                    {alarm.pickupPoint.address}
                    {alarm.route.name && <span> · {alarm.route.name}</span>}
                    <span> · {timeLabel}</span>
                  </p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(alarm.id)}
                  disabled={deleteMutation.isPending}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-status-alert/10 text-on-surface-variant hover:text-status-alert transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}