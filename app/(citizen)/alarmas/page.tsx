'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Zone } from '@/lib/types';

interface CitizenAlarm {
  id: string;
  zoneId: string;
  dayOfWeek: string;
  label: string | null;
  active: boolean;
  createdAt: string;
  zone: { id: string; name: string };
}

const DAYS: { value: string; label: string; short: string }[] = [
  { value: 'MONDAY', label: 'Lunes', short: 'Lun' },
  { value: 'TUESDAY', label: 'Martes', short: 'Mar' },
  { value: 'WEDNESDAY', label: 'Miércoles', short: 'Mié' },
  { value: 'THURSDAY', label: 'Jueves', short: 'Jue' },
  { value: 'FRIDAY', label: 'Viernes', short: 'Vie' },
  { value: 'SATURDAY', label: 'Sábado', short: 'Sáb' },
  { value: 'SUNDAY', label: 'Domingo', short: 'Dom' },
];

const today = new Date().toLocaleDateString('es', { weekday: 'long' }).toUpperCase();
const todayValue = DAYS.find((d) => today.startsWith(d.label.slice(0, 3).toUpperCase()))?.value;

export default function AlarmasPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ zoneId: '', dayOfWeek: 'MONDAY', label: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: () => api.get<Zone[]>('/zones'),
  });

  const { data: alarms = [], isLoading } = useQuery<CitizenAlarm[]>({
    queryKey: ['citizen-alarms'],
    queryFn: () => api.get<CitizenAlarm[]>('/citizen-alarms'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post<CitizenAlarm>('/citizen-alarms', {
        zoneId: data.zoneId,
        dayOfWeek: data.dayOfWeek,
        label: data.label || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['citizen-alarms'] });
      setShowForm(false);
      setForm({ zoneId: '', dayOfWeek: 'MONDAY', label: '' });
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
    if (!form.zoneId) { setFormError('Seleccioná una zona'); return; }
    createMutation.mutate(form);
  }

  // Alarms for today highlighted at top
  const todayAlarms = alarms.filter((a) => a.dayOfWeek === todayValue);
  const otherAlarms = alarms.filter((a) => a.dayOfWeek !== todayValue);

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
        Recibí recordatorios sobre los días de recolección en tu zona.
      </p>

      {/* Form modal */}
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
                  Zona
                </label>
                <select
                  value={form.zoneId}
                  onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))}
                  className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccioná una zona</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                  Día de recolección
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, dayOfWeek: d.value }))}
                      className={`py-2 rounded-lg text-[11px] font-bold transition-colors ${
                        form.dayOfWeek === d.value
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10'
                      }`}
                    >
                      {d.short}
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
                  placeholder="Ej: Orgánicos, Reciclables..."
                  className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {formError && (
                <p className="text-status-alert text-[12px]">{formError}</p>
              )}

              <button
                type="submit"
                disabled={createMutation.isPending}
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
            Creá alarmas para recordar los días de recolección en tu zona.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {todayAlarms.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-2">
                🔔 Hoy
              </p>
              <div className="space-y-2">
                {todayAlarms.map((alarm) => (
                  <AlarmCard
                    key={alarm.id}
                    alarm={alarm}
                    isToday
                    onDelete={() => deleteMutation.mutate(alarm.id)}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
          {otherAlarms.length > 0 && (
            <div>
              {todayAlarms.length > 0 && (
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-2 mt-4">
                  Próximas
                </p>
              )}
              <div className="space-y-2">
                {otherAlarms.map((alarm) => (
                  <AlarmCard
                    key={alarm.id}
                    alarm={alarm}
                    isToday={false}
                    onDelete={() => deleteMutation.mutate(alarm.id)}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AlarmCardProps {
  alarm: CitizenAlarm;
  isToday: boolean;
  onDelete: () => void;
  deleting: boolean;
}

function AlarmCard({ alarm, isToday, onDelete, deleting }: AlarmCardProps) {
  const day = DAYS.find((d) => d.value === alarm.dayOfWeek);
  return (
    <div className={`bg-surface-card rounded-xl border flex items-center gap-4 p-4 ${
      isToday ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/20'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isToday ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant'
      }`}>
        <span className="material-symbols-outlined text-sm">
          {isToday ? 'notifications_active' : 'notifications'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-on-surface truncate">
          {alarm.label ?? alarm.zone.name}
        </p>
        <p className="text-[12px] text-on-surface-variant">
          {alarm.zone.name} · {day?.label ?? alarm.dayOfWeek}
        </p>
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-status-alert/10 text-on-surface-variant hover:text-status-alert transition-colors disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-sm">delete</span>
      </button>
    </div>
  );
}
