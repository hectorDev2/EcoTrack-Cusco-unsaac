'use client';

export interface RouteScheduleInput {
  days: string[];
  time: string;
  label?: string;
}

const DAY_OPTIONS: { code: string; short: string }[] = [
  { code: 'MON', short: 'L' },
  { code: 'TUE', short: 'M' },
  { code: 'WED', short: 'X' },
  { code: 'THU', short: 'J' },
  { code: 'FRI', short: 'V' },
  { code: 'SAT', short: 'S' },
  { code: 'SUN', short: 'D' },
];

const PRESETS: { label: string; days: string[] }[] = [
  { label: 'LMV', days: ['MON', 'WED', 'FRI'] },
  { label: 'MJS', days: ['TUE', 'THU', 'SAT'] },
  { label: 'Diario', days: DAY_OPTIONS.map((d) => d.code) },
  { label: 'Solo domingo', days: ['SUN'] },
];

/**
 * Editor de los horarios de una ruta — una ruta puede tener varios (ej.
 * Lun/Mié/Vie 06:00 Y ADEMÁS Mar/Jue/Sáb 17:00), así que esto es una lista
 * de filas {días, hora}, no un único selector de turno+frecuencia.
 */
export default function RouteScheduleEditor({
  schedules,
  onChange,
}: {
  schedules: RouteScheduleInput[];
  onChange: (schedules: RouteScheduleInput[]) => void;
}) {
  const update = (index: number, patch: Partial<RouteScheduleInput>) => {
    onChange(schedules.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const toggleDay = (index: number, code: string) => {
    const current = schedules[index].days;
    const next = current.includes(code) ? current.filter((d) => d !== code) : [...current, code];
    update(index, { days: next });
  };

  const remove = (index: number) => onChange(schedules.filter((_, i) => i !== index));

  const add = () => onChange([...schedules, { days: [], time: '06:00' }]);

  return (
    <div>
      <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-1.5">
        Horarios ({schedules.length})
      </label>

      {schedules.length === 0 && (
        <p className="text-[12px] text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 mb-2">
          Sin horarios — la ruta no se repite automáticamente.
        </p>
      )}

      <div className="space-y-2">
        {schedules.map((schedule, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => toggleDay(i, d.code)}
                  className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                    schedule.days.includes(d.code)
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface text-on-surface-variant border border-outline-variant'
                  }`}
                >
                  {d.short}
                </button>
              ))}
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-auto w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                title="Quitar horario"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={schedule.time}
                onChange={(e) => update(i, { time: e.target.value })}
                className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-[12px] focus:ring-2 focus:ring-primary outline-none"
              />
              <input
                value={schedule.label ?? ''}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Etiqueta (opcional)"
                className="flex-1 min-w-0 bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-[12px] focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        <button
          type="button"
          onClick={add}
          className="px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary text-[11px] font-bold flex items-center gap-1 hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Agregar horario
        </button>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange([...schedules, { days: preset.days, time: '06:00' }])}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] font-bold hover:bg-surface-variant transition-colors"
          >
            + {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
