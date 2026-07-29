'use client';

import { type DriverRoute, SHIFT_LABELS } from '@/lib/driver-routes';

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: 'border-primary bg-primary/5',
  PENDING: 'border-outline-variant/30',
  COMPLETED: 'border-waste-organic/30 bg-waste-organic/5 opacity-80',
};

/** Selector de la ruta (zona/turno) activa cuando el conductor tiene más de una a su cargo, en el orden en que le tocan durante el día. */
export default function DriverRouteSwitcher({
  routes,
  selectedId,
  onSelect,
}: {
  routes: DriverRoute[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  if (routes.length < 2) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] px-1">
        Tus zonas de hoy ({routes.length})
      </h3>
      <div className="flex flex-col gap-2">
        {routes.map((route) => {
          const isSelected = route.id === selectedId;
          const isDone = route.status === 'COMPLETED';
          return (
            <button
              key={route.id}
              onClick={() => onSelect(route.id)}
              className={`text-left rounded-xl p-3 border-2 transition-colors ${
                isSelected ? STATUS_STYLES.IN_PROGRESS : 'border-transparent bg-surface-card'
              } ${!isSelected ? STATUS_STYLES[route.status] ?? 'border-outline-variant/20' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-waste-organic/15 text-waste-organic' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {isDone ? 'check_circle' : 'local_shipping'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface truncate">
                    {route.name ?? route.zone?.name ?? 'Ruta'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    {route.shift ? SHIFT_LABELS[route.shift] ?? route.shift : ''}
                    {route.zone?.name ? ` · ${route.zone.name}` : ''}
                    {' · '}{route.completedStops}/{route.totalStops} paradas
                  </p>
                </div>
                {isDone && (
                  <span className="text-[10px] font-bold text-waste-organic uppercase tracking-[0.06em] flex-shrink-0">
                    Hecho
                  </span>
                )}
                {!isDone && route.status === 'IN_PROGRESS' && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.06em] flex-shrink-0">
                    En curso
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
