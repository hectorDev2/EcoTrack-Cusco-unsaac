import type { PickupPoint } from '@/lib/types';

export function PickupPointCard({ point }: { point: PickupPoint }) {
  return (
    <div className="bg-surface-card rounded-xl border border-outline-variant p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-sm text-primary">location_on</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] leading-[20px] font-bold text-on-surface">{point.name}</p>
          <p className="text-[12px] leading-[16px] text-on-surface-variant mt-0.5">{point.address}</p>
          {point.zone && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-surface-container-high text-[11px] leading-[14px] tracking-[0.05em] font-bold text-on-surface-variant">
              {point.zone.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
