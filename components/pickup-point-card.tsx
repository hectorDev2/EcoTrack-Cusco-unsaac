import type { PickupPoint } from '@/lib/types';

const SHIFT_LABELS: Record<string, string> = {
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
  DOMINICAL: 'Dominical',
};

const STOP_TYPE_COLORS: Record<string, string> = {
  NORMAL: 'bg-surface-container-high text-on-surface-variant',
  CAMPANEO: 'bg-secondary-container/20 text-secondary',
  REPECHAJE: 'bg-tertiary-container/20 text-tertiary',
  VIA_PUBLICA: 'bg-waste-organic/10 text-waste-organic',
  DOMINICAL: 'bg-primary-container/20 text-primary',
};

const STOP_TYPE_ICONS: Record<string, string> = {
  NORMAL: 'location_on',
  CAMPANEO: 'campaign',
  REPECHAJE: 'replay',
  VIA_PUBLICA: 'route',
  DOMINICAL: 'event',
};

export function PickupPointCard({ point }: { point: PickupPoint }) {
  const stopTypeColor = STOP_TYPE_COLORS[point.stopType] ?? STOP_TYPE_COLORS.NORMAL;
  const stopTypeIcon = STOP_TYPE_ICONS[point.stopType] ?? 'location_on';
  const shiftLabel = point.shift ? SHIFT_LABELS[point.shift] : null;

  return (
    <div className="bg-surface-card rounded-xl border border-outline-variant p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-sm text-primary">{stopTypeIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          {/* Hora + nombre */}
          <div className="flex items-baseline gap-2">
            {point.scheduledTime && (
              <span className="text-[14px] leading-[20px] font-extrabold text-primary tabular-nums">
                {point.scheduledTime}
              </span>
            )}
            <p className="text-[14px] leading-[20px] font-bold text-on-surface truncate">
              {point.address}
            </p>
          </div>

          {/* Tags: tipo, turno, frecuencia, zona */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] leading-[14px] tracking-[0.05em] font-extrabold uppercase ${stopTypeColor}`}>
              {point.stopType.replace('_', ' ')}
            </span>
            {shiftLabel && (
              <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-[10px] leading-[14px] tracking-[0.05em] font-bold uppercase text-on-surface-variant">
                {shiftLabel}
              </span>
            )}
            {point.frequency && (
              <span className="px-2 py-0.5 rounded-md bg-primary/5 text-[10px] leading-[14px] tracking-[0.05em] font-bold uppercase text-primary">
                {point.frequency.code}
              </span>
            )}
            {point.zone && (
              <span className="px-2 py-0.5 rounded-md bg-outline/10 text-[10px] leading-[14px] tracking-[0.05em] font-bold uppercase text-on-surface-variant">
                {point.zone.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
