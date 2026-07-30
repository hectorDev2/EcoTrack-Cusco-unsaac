'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queries } from '@/lib/queries';
import { ScheduleCard } from '@/components/schedule-card';
import type { Zone, CollectionSchedule } from '@/lib/types';

// Semana en orden Lun→Dom con su inicial, para pintar de un vistazo qué días
// corre cada frecuencia (los que están en freq.days quedan resaltados).
const WEEK: { code: string; short: string }[] = [
  { code: 'MON', short: 'L' },
  { code: 'TUE', short: 'M' },
  { code: 'WED', short: 'M' },
  { code: 'THU', short: 'J' },
  { code: 'FRI', short: 'V' },
  { code: 'SAT', short: 'S' },
  { code: 'SUN', short: 'D' },
];

function DayStrip({ days }: { days: string }) {
  const active = new Set(days.split(',').map((d) => d.trim()));
  return (
    <div className="flex gap-1 mt-2" aria-label={`Días: ${days}`}>
      {WEEK.map((d, i) => {
        const on = active.has(d.code);
        return (
          <span
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              on
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant/50'
            }`}
          >
            {d.short}
          </span>
        );
      })}
    </div>
  );
}

export default function RecoleccionPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: frequencies } = useQuery(queries.frequencies.all());

  useEffect(() => {
    api.get<Zone[]>('/zones')
      .then((data) => setZones(data))
      .catch(() => setError('Error al cargar zonas'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedZone) {
       
      setSchedules([]);
      return;
    }
    api.get<CollectionSchedule[]>(`/schedules?zoneId=${selectedZone}`)
      .then(setSchedules)
      .catch(() => setError('Error al cargar horarios'));
  }, [selectedZone]);

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-[24px] leading-[32px] font-extrabold text-primary mb-1">
          Recolección
        </h1>
        <p className="text-[14px] leading-[20px] text-on-surface-variant mb-6">
          Consultá los horarios de recolección según tu zona.
        </p>

        {error && (
          <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert text-sm">error</span>
            <p className="text-status-alert text-sm font-bold">{error}</p>
          </div>
        )}

        {/* Frecuencias */}
        {frequencies && frequencies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-3">
              Frecuencias de recolección
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {frequencies.map((freq) => (
                <div
                  key={freq.id}
                  className="bg-surface-card rounded-xl border border-outline-variant p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">
                        event_repeat
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                        {freq.code}
                      </span>
                      <p className="text-[14px] font-bold text-on-surface mt-1">
                        {freq.label}
                      </p>
                      <DayStrip days={freq.days} />
                      <p className="text-[12px] text-on-surface-variant mt-1.5">
                        {freq.pickupPointsCount ?? 0} paradas
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-2">
            Seleccioná tu zona
          </label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
          >
            <option value="">Todas las zonas</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-3xl text-outline block mb-2">schedule</span>
            <p className="text-on-surface-variant text-sm font-bold">
              {selectedZone ? 'No hay horarios para esta zona' : 'Seleccioná una zona para ver sus horarios'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <ScheduleCard key={s.id} schedule={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
