'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ScheduleCard } from '@/components/schedule-card';
import type { Zone, CollectionSchedule } from '@/lib/types';

export default function RecoleccionPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Zone[]>('/zones')
      .then((data) => setZones(data))
      .catch(() => setError('Error al cargar zonas'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedZone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
