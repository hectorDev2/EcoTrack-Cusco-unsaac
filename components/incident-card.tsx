import type { Incident } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  CONTAINER_DAMAGED: 'Contenedor dañado',
  MISSED_COLLECTION: 'Recolección no realizada',
  ILLEGAL_DUMPING: 'Vertido ilegal',
  OTHER: 'Otro',
};

const TYPE_ICONS: Record<string, string> = {
  CONTAINER_DAMAGED: 'delete',
  MISSED_COLLECTION: 'local_shipping',
  ILLEGAL_DUMPING: 'warning',
  OTHER: 'report_problem',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-status-alert/10 text-status-alert',
  IN_PROGRESS: 'bg-secondary-container/20 text-secondary',
  RESOLVED: 'bg-waste-organic/10 text-waste-organic',
  CLOSED: 'bg-surface-container-high text-on-surface-variant',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

export function IncidentCard({ incident }: { incident: Incident }) {
  const date = new Date(incident.createdAt).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-surface-card rounded-xl border border-outline-variant p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-sm text-primary">
            {TYPE_ICONS[incident.type] ?? 'report_problem'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[14px] leading-[20px] font-bold text-on-surface">
                {TYPE_LABELS[incident.type] ?? incident.type}
              </p>
              {incident.zone && (
                <p className="text-[12px] leading-[16px] text-on-surface-variant">
                  {incident.zone.name}
                </p>
              )}
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] leading-[14px] tracking-[0.05em] font-bold ${STATUS_STYLES[incident.status] ?? ''}`}>
              {STATUS_LABELS[incident.status] ?? incident.status}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-[18px] text-on-surface-variant line-clamp-2">
            {incident.description}
          </p>
          <p className="mt-2 text-[11px] leading-[14px] text-outline">
            {date}
          </p>
        </div>
      </div>
    </div>
  );
}
