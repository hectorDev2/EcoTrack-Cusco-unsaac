'use client';

import { useState, useEffect } from 'react';
import { api, ApiClientError } from '@/lib/api';
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

const TYPE_STYLES: Record<string, string> = {
  CONTAINER_DAMAGED: 'bg-waste-non-recyclable/10 text-waste-non-recyclable',
  MISSED_COLLECTION: 'bg-waste-organic/10 text-waste-organic',
  ILLEGAL_DUMPING: 'bg-status-alert/10 text-status-alert',
  OTHER: 'bg-surface-container-high text-on-surface-variant',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Pendiente',
  IN_PROGRESS: 'En Proceso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-error-container text-on-error-container',
  IN_PROGRESS: 'bg-secondary-container text-on-secondary-container',
  RESOLVED: 'bg-primary-fixed-dim/30 text-primary',
  CLOSED: 'bg-surface-container-high text-on-surface-variant',
};

export default function IncidenciasAdminPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchIncidents = () => {
    setIsLoading(true);
    api.get<Incident[]>('/incidents')
      .then(setIncidents)
      .catch(() => setError('Error al cargar incidencias'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIncidents();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/incidents/${id}`, { status });
      fetchIncidents();
    } catch (err) {
      if (err instanceof ApiClientError) alert(err.message);
      else alert('Error al actualizar');
    } finally {
      setUpdatingId(null);
    }
  };

  const openCount = incidents.filter((i) => i.status === 'OPEN').length;
  const inProgressCount = incidents.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;

  const stats = [
    { label: 'PENDIENTE', value: String(openCount), icon: 'pending_actions', style: 'bg-primary-fixed text-primary' },
    { label: 'EN PROCESO', value: String(inProgressCount), icon: 'engineering', style: 'bg-secondary-fixed text-secondary' },
    { label: 'RESUELTO', value: String(resolvedCount), icon: 'task_alt', style: 'bg-primary-fixed-dim text-on-primary-fixed-variant' },
    { label: 'TOTAL', value: String(incidents.length), icon: 'report', style: 'bg-error-container text-on-error-container' },
  ];

  return (
    <>
      <header className="flex justify-between items-center w-full px-6 py-2 sticky top-0 z-10 bg-surface border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-[16px] leading-[24px] focus:ring-2 focus:ring-primary"
              placeholder="Buscar incidencias..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-on-error text-[10px] leading-[14px] font-bold rounded-full flex items-center justify-center">
              {openCount}
            </span>
          </button>
        </div>
      </header>

      <div className="p-6 overflow-auto">
        <div className="max-w-[1440px] mx-auto space-y-6">
          <h3 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
            Gestión de Incidencias
          </h3>

          {error && (
            <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-status-alert">error</span>
              <p className="text-status-alert text-sm font-bold">{error}</p>
              <button onClick={fetchIncidents} className="ml-auto underline text-xs font-bold">Reintentar</button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface-card p-4 rounded-xl shadow-sm border border-outline-variant flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.style}`}>
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <div>
                  <p className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">{s.label}</p>
                  <p className="text-[24px] leading-[32px] font-bold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface-card rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="px-6 py-4 text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Tipo</th>
                      <th className="px-6 py-4 text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Descripción</th>
                      <th className="px-6 py-4 text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Zona</th>
                      <th className="px-6 py-4 text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Estado</th>
                      <th className="px-6 py-4 text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Fecha</th>
                      <th className="px-6 py-4 text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-surface-container transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TYPE_STYLES[inc.type] ?? ''}`}>
                              <span className="material-symbols-outlined text-sm">{TYPE_ICONS[inc.type] ?? 'report_problem'}</span>
                            </div>
                            <span className="text-sm font-bold">{TYPE_LABELS[inc.type] ?? inc.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant max-w-xs truncate">
                          {inc.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                          {inc.zone?.name ?? '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] leading-[14px] tracking-[0.05em] font-bold ${STATUS_STYLES[inc.status] ?? ''}`}>
                            {STATUS_LABELS[inc.status] ?? inc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                          {new Date(inc.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={inc.status}
                            onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                            disabled={updatingId === inc.id}
                            className="text-xs font-bold bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1 focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                          >
                            <option value="OPEN">Pendiente</option>
                            <option value="IN_PROGRESS">En Proceso</option>
                            <option value="RESOLVED">Resuelto</option>
                            <option value="CLOSED">Cerrado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
