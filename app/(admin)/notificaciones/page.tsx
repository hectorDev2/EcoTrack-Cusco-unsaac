'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queries } from '@/lib/queries';

const TYPE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  browser: 'Navegador',
  email: 'Email',
};

const STATUS_STYLES: Record<string, string> = {
  SENT: 'bg-waste-organic/10 text-waste-organic',
  FAILED: 'bg-status-alert/10 text-status-alert',
  DELIVERED: 'bg-primary-fixed-dim/30 text-primary',
};

const TYPE_FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Navegador', value: 'browser' },
];

export default function NotificacionesAdminPage() {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');

  const { data, isLoading } = useQuery(queries.admin.notifications(page, filterType || undefined));

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 overflow-auto">
      <div className="max-w-[1440px] mx-auto space-y-6">
        <h3 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
          Historial de Notificaciones
        </h3>

        <div className="flex gap-2 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilterType(f.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                filterType === f.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-high/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-surface-card rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4">notifications</span>
              <p className="text-sm font-bold">No hay notificaciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 text-[11px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Tipo</th>
                    <th className="px-6 py-4 text-[11px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Destino</th>
                    <th className="px-6 py-4 text-[11px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Mensaje</th>
                    <th className="px-6 py-4 text-[11px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Estado</th>
                    <th className="px-6 py-4 text-[11px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Usuario</th>
                    <th className="px-6 py-4 text-[11px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Envío</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container transition-colors">
                      <td className="px-6 py-4 text-sm font-bold">
                        {TYPE_LABELS[log.type] ?? log.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {log.recipient}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] tracking-[0.05em] font-bold ${STATUS_STYLES[log.status] ?? ''}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {log.user?.fullName ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {new Date(log.sentAt).toLocaleDateString('es-PE', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-surface-container-high text-on-surface-variant disabled:opacity-40"
            >
              Anterior
            </button>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-[12px] font-bold ${
                  p === page ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-high/70'
                } transition-colors`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-surface-container-high text-on-surface-variant disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
