'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '@/lib/queries';
import { api, ApiClientError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function AlarmasPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedPoint, setSelectedPoint] = useState('');
  const [notifyBefore, setNotifyBefore] = useState('30');

  const { data: alarms = [], isLoading, error } = useQuery(queries.userAlarms.my());
  const { data: routes = [] } = useQuery(queries.routes.public());
  const { data: points = [] } = useQuery(queries.pickupPoints.all(undefined, selectedRoute || undefined));

  const createMutation = useMutation({
    mutationFn: (data: { pickupPointId: string; routeId: string; title: string; notifyBeforeMinutes: number }) =>
      api.post('/user-alarms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alarms'] });
      setShowForm(false);
      setTitle('');
      setSelectedRoute('');
      setSelectedPoint('');
      setNotifyBefore('30');
      addToast('success', 'Alarma creada correctamente');
    },
    onError: (err) => {
      addToast('error', err instanceof ApiClientError ? err.message : 'Error al crear alarma');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch(`/user-alarms/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alarms'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/user-alarms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alarms'] });
      addToast('success', 'Alarma eliminada');
    },
    onError: (err) => {
      addToast('error', err instanceof ApiClientError ? err.message : 'Error al eliminar alarma');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute || !selectedPoint || !title) return;
    createMutation.mutate({
      pickupPointId: selectedPoint,
      routeId: selectedRoute,
      title,
      notifyBeforeMinutes: parseInt(notifyBefore, 10),
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] leading-[32px] font-extrabold text-primary mb-1">Mis Alarmas</h1>
            <p className="text-[14px] leading-[20px] text-on-surface-variant">Recibe avisos de recolección en tus puntos de interés.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-on-primary px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-1 active:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancelar' : 'Nueva'}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert text-sm">error</span>
            <p className="text-status-alert text-sm font-bold">{(error as Error).message ?? 'Error al cargar alarmas'}</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="bg-surface-card rounded-2xl p-5 border border-outline-variant/20 mb-6 space-y-4">
            <div>
              <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Recojo de mi cuadra"
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Ruta</label>
              <select
                value={selectedRoute}
                onChange={(e) => { setSelectedRoute(e.target.value); setSelectedPoint(''); }}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
                required
              >
                <option value="">Seleccionar ruta...</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Punto de recolección</label>
              <select
                value={selectedPoint}
                onChange={(e) => setSelectedPoint(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
                required
                disabled={!selectedRoute}
              >
                <option value="">Seleccionar punto...</option>
                {points.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} - {p.address}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Notificar minutos antes</label>
              <select
                value={notifyBefore}
                onChange={(e) => setNotifyBefore(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="120">2 horas</option>
                <option value="1440">1 día</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending || !selectedRoute || !selectedPoint || !title}
              className="w-full bg-primary text-on-primary py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:opacity-80 transition-opacity"
            >
              {createMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
              )}
              Crear Alarma
            </button>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alarms.length === 0 && !showForm ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-3xl text-outline block mb-2">notifications_off</span>
            <p className="text-on-surface-variant text-sm font-bold">No tienes alarmas configuradas</p>
            <p className="text-on-surface-variant text-xs mt-1">Crea una para recibir avisos de recolección.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alarms.map((alarm) => (
              <div key={alarm.id} className={`bg-surface-card rounded-xl p-4 border flex items-center gap-4 ${
                alarm.enabled ? 'border-outline-variant/20' : 'border-outline-variant/10 opacity-60'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  alarm.enabled ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-outline'
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {alarm.enabled ? 'notifications_active' : 'notifications_off'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-on-surface truncate">{alarm.title}</h3>
                  <p className="text-[12px] text-on-surface-variant truncate">
                    {alarm.pickupPoint?.name ?? 'Punto no disponible'}
                    {alarm.route?.name ? ` · ${alarm.route.name}` : ''}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {alarm.notifyBeforeMinutes >= 1440
                      ? `${alarm.notifyBeforeMinutes / 1440} día(s) antes`
                      : alarm.notifyBeforeMinutes >= 60
                        ? `${alarm.notifyBeforeMinutes / 60} hora(s) antes`
                        : `${alarm.notifyBeforeMinutes} min antes`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ id: alarm.id, enabled: !alarm.enabled })}
                    disabled={toggleMutation.isPending}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      alarm.enabled
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container-high text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {alarm.enabled ? 'notifications' : 'notifications_off'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar esta alarma?')) deleteMutation.mutate(alarm.id);
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-9 h-9 rounded-lg flex items-center justify-center bg-error/10 text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
