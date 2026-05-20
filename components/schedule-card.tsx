import type { CollectionSchedule } from '@/lib/types';

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

const CATEGORY_COLORS: Record<string, string> = {
  ORGANIC: 'bg-waste-organic/10 text-waste-organic border-waste-organic/20',
  RECYCLABLE: 'bg-waste-recyclable/10 text-waste-recyclable border-waste-recyclable/20',
  NON_RECYCLABLE: 'bg-waste-non-recyclable/10 text-waste-non-recyclable border-waste-non-recyclable/20',
};

export function ScheduleCard({ schedule }: { schedule: CollectionSchedule }) {
  const dayLabel = DAY_LABELS[schedule.dayOfWeek] ?? schedule.dayOfWeek;
  const category = schedule.wasteType?.category ?? '';
  const colorClass = CATEGORY_COLORS[category] ?? 'bg-surface-container-high text-on-surface-variant';

  return (
    <div className="bg-surface-card rounded-xl border border-outline-variant p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <span className="material-symbols-outlined text-sm">
          {category === 'ORGANIC' ? 'eco' : category === 'RECYCLABLE' ? 'recycling' : 'delete'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-[20px] font-bold text-on-surface">{dayLabel}</p>
        <p className="text-[12px] leading-[16px] text-on-surface-variant truncate">
          {schedule.wasteType?.name ?? 'General'} · {schedule.zone?.name}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[14px] leading-[20px] font-bold text-primary">{schedule.startTime}</p>
        <p className="text-[11px] leading-[14px] text-on-surface-variant">{schedule.endTime}</p>
      </div>
    </div>
  );
}
