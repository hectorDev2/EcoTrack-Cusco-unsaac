'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AnalyticsData {
  stats: {
    totalWaste: number;
    recyclingRate: number;
    activeRoutes: string;
    criticalAlerts: number;
  };
  incidentsByDay: { date: string; count: number }[];
  wasteComposition: { category: string; name: string; count: number; percentage: number }[];
  zoneRanking: {
    name: string;
    participationRate: number;
    pickupPoints: number;
    schedules: number;
    incidents: number;
    status: string;
    statusStyle: string;
  }[];
  totalZones: number;
  totalPickupPoints: number;
  totalSchedules: number;
  totalIncidents: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase();
}

export default function AnalisisPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AnalyticsData>('/admin/analytics')
      .then(setData)
      .catch((err) => setError(err.message ?? 'Error al cargar analíticas'))
      .finally(() => setLoading(false));
  }, []);

  const maxChartCount = Math.max(...(data?.incidentsByDay.map((d) => d.count) ?? [1]), 1);
  const chartHeight = 200;

  return (
    <>
      <header className="flex justify-between items-center w-full px-6 py-2 sticky top-0 bg-surface border-b border-outline-variant/30 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
            <input className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-[16px] leading-[24px] w-64" placeholder="Buscar reportes..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">help</button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-primary-fixed bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface leading-tight">Administrador Principal</p>
              <p className="text-xs text-on-surface-variant">Cusco Municipal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-lg">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-on-surface-variant text-sm font-bold">Cargando analíticas...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert">error</span>
            <p className="text-status-alert text-sm font-bold">{error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-surface-card p-4 rounded-xl shadow-sm border border-outline-variant/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined">delete</span>
                </div>
                <div>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">Cobertura Total</p>
                  <p className="text-[24px] leading-[32px] font-bold">{data.totalSchedules} horarios</p>
                </div>
              </div>
              <div className="bg-surface-card p-4 rounded-xl shadow-sm border border-outline-variant/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-secondary-fixed text-secondary">
                  <span className="material-symbols-outlined">recycling</span>
                </div>
                <div>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">Tasa de Reciclaje</p>
                  <p className="text-[24px] leading-[32px] font-bold">{data.stats.recyclingRate}%</p>
                </div>
              </div>
              <div className="bg-surface-card p-4 rounded-xl shadow-sm border border-outline-variant/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-tertiary-fixed text-tertiary">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <div>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">Rutas Activas</p>
                  <p className="text-[24px] leading-[32px] font-bold">{data.stats.activeRoutes}</p>
                </div>
              </div>
              <div className="bg-surface-card p-4 rounded-xl shadow-sm border border-outline-variant/20 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${data.stats.criticalAlerts > 0 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">Alertas Críticas</p>
                  <p className="text-[24px] leading-[32px] font-bold">{String(data.stats.criticalAlerts).padStart(2, '0')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-surface-card p-6 rounded-xl shadow-sm border border-outline-variant/20">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">Incidencias por Día</h3>
                    <p className="text-[14px] leading-[20px] text-on-surface-variant">Últimos 30 días</p>
                  </div>
                </div>
                <div className="h-64 chart-grid relative overflow-hidden rounded-lg" style={{ height: `${chartHeight + 60}px` }}>
                  <div className="absolute inset-0 flex items-end justify-around px-2">
                    {data.incidentsByDay.length === 0 && (
                      <p className="text-on-surface-variant text-sm self-center">Sin incidencias en los últimos 30 días</p>
                    )}
                    {data.incidentsByDay.map((day) => (
                      <div key={day.date} className="flex flex-col items-center gap-1 flex-1 max-w-[40px]">
                        <span className="text-[10px] font-bold text-on-surface-variant">{day.count}</span>
                        <div
                          className="w-full bg-primary-container rounded-t transition-all hover:bg-primary"
                          style={{ height: `${(day.count / maxChartCount) * chartHeight}px` }}
                        />
                        <span className="text-[8px] font-bold text-on-surface-variant -rotate-45 origin-left whitespace-nowrap">
                          {formatDate(day.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface-card p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col items-center justify-between">
                <div className="w-full text-left">
                  <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">Composición de Residuos</h3>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">Distribución por horarios</p>
                </div>
                <div className="relative w-48 h-48 my-md">
                  <div className="w-full h-full rounded-full border-8 border-waste-organic"
                    style={{
                      borderRightColor: '#2196F3',
                      borderBottomColor: '#757575',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">100%</span>
                    <span className="text-xs text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">TOTAL</span>
                  </div>
                </div>
                <div className="w-full space-y-sm">
                  {data.wasteComposition.map((wt) => (
                    <div key={wt.category} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          wt.category === 'ORGANIC' ? 'bg-waste-organic' :
                          wt.category === 'RECYCLABLE' ? 'bg-waste-recyclable' :
                          'bg-waste-non-recyclable'
                        }`} />
                        <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">{wt.name}</span>
                      </div>
                      <span className="font-bold">{wt.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-surface-card rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <div>
                  <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">Zonas con Mayor Participación</h3>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant">Ranking de compromiso ciudadano por distrito</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-high text-on-surface-variant text-[11px] leading-[14px] tracking-[0.08em] font-extrabold uppercase">
                    <tr>
                      <th className="px-6 py-md">Distrito / Zona</th>
                      <th className="px-6 py-md">Tasa Part.</th>
                      <th className="px-6 py-md">Puntos Verdes</th>
                      <th className="px-6 py-md">Horarios</th>
                      <th className="px-6 py-md">Incidencias</th>
                      <th className="px-6 py-md">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {data.zoneRanking.map((row, i) => (
                      <tr key={row.name} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-md">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                              {String(i + 1).padStart(2, '0')}
                            </div>
                            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-md">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-surface-variant rounded-full overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: `${row.participationRate}%` }} />
                            </div>
                            <span className="text-xs font-bold">{row.participationRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-md text-[16px] leading-[24px]">{row.pickupPoints}</td>
                        <td className="px-6 py-md text-[16px] leading-[24px]">{row.schedules}</td>
                        <td className="px-6 py-md text-[16px] leading-[24px]">{row.incidents}</td>
                        <td className="px-6 py-md">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.statusStyle}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <button className="fixed bottom-xl right-xl w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
        <span className="material-symbols-outlined">file_download</span>
      </button>
    </>
  );
}
