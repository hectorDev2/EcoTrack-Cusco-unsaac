'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queries } from '@/lib/queries';
import { api, ApiClientError } from '@/lib/api';
import type { Zone } from '@/lib/types';

interface ZoneForm {
  name: string;
  description: string;
}

const emptyForm: ZoneForm = { name: '', description: '' };

export default function AdminZonasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data: zones = [], isLoading } = useQuery(queries.zones.all());

  const createMutation = useMutation({
    mutationFn: (data: ZoneForm) => api.post<Zone>('/zones', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.all() });
      setForm(emptyForm);
      setShowForm(false);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : 'Error al crear zona');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ZoneForm & { status: string }> }) =>
      api.patch<Zone>(`/zones/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.all() });
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : 'Error al actualizar zona');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/zones/${id}`, { status: 'INACTIVE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.all() });
    },
  });

  function handleEdit(zone: Zone) {
    setForm({ name: zone.name, description: zone.description ?? '' });
    setEditingId(zone.id);
    setShowForm(true);
    setError(null);
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] leading-[32px] font-bold text-primary">Zonas</h1>
          <p className="text-[14px] leading-[20px] text-on-surface-variant">
            Gestión de distritos y zonas de recolección
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-[12px] font-bold hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva zona
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-status-alert text-sm">error</span>
          <p className="text-status-alert text-sm font-bold">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-surface-card rounded-xl p-6 border border-outline-variant/20 shadow-sm">
          <h3 className="text-[16px] font-bold text-on-surface mb-4">
            {editingId ? 'Editar zona' : 'Nueva zona'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">
                Nombre
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ej. Centro Histórico"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Descripción opcional de la zona"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl text-[12px] font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-surface-variant text-on-surface-variant rounded-xl text-[12px] font-bold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-12 bg-surface-card rounded-xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-3xl text-outline block mb-2">map</span>
          <p className="text-on-surface-variant text-sm font-bold">No hay zonas registradas</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-surface-card rounded-xl p-5 border border-outline-variant/20 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${zone.status === 'ACTIVE' ? 'bg-primary/10' : 'bg-surface-variant'}`}>
                  <span className={`material-symbols-outlined ${zone.status === 'ACTIVE' ? 'text-primary' : 'text-on-surface-variant'}`}>
                    map
                  </span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-on-surface">{zone.name}</h3>
                  {zone.description && (
                    <p className="text-[13px] text-on-surface-variant mt-0.5">{zone.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      zone.status === 'ACTIVE' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                      {zone.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(zone)}
                  className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                {zone.status === 'ACTIVE' && (
                  <button
                    onClick={() => deactivateMutation.mutate(zone.id)}
                    className="p-2 text-on-surface-variant hover:text-status-alert hover:bg-status-alert/10 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">toggle_off</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
