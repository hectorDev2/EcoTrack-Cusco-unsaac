'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Vehicle } from '@/lib/types';

interface Driver {
  id: string;
  fullName: string;
  email: string;
}

interface VehicleWithDriver extends Vehicle {
  driver: Driver | null;
}

interface VehicleForm {
  plate: string;
  brand: string;
  model: string;
  capacity: string;
  driverId: string;
}

const EMPTY_FORM: VehicleForm = { plate: '', brand: '', model: '', capacity: '', driverId: '' };

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  MAINTENANCE: 'Mantenimiento',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-waste-organic/10 text-waste-organic',
  INACTIVE: 'bg-surface-container-high text-on-surface-variant',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function VehicleFormFields({
  form,
  setForm,
  drivers,
  error,
  onSubmit,
  isPending,
  submitLabel,
}: {
  form: VehicleForm;
  setForm: React.Dispatch<React.SetStateAction<VehicleForm>>;
  drivers: Driver[];
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const field = (k: keyof VehicleForm) => (
    <input
      value={form[k]}
      onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
      className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
    />
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Placa *</label>
        {field('plate')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Marca</label>
          {field('brand')}
        </div>
        <div>
          <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Modelo</label>
          {field('model')}
        </div>
      </div>
      <div>
        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Capacidad (kg)</label>
        {field('capacity')}
      </div>
      <div>
        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Conductor asignado</label>
        <select
          value={form.driverId}
          onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
          className="w-full bg-surface-card border border-outline-variant rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Sin asignar</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.fullName}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-status-alert text-[12px]">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-on-primary px-4 py-3 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {isPending ? 'Guardando...' : submitLabel}
      </button>
    </form>
  );
}

export default function VehiculosPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<VehicleWithDriver | null>(null);
  const [createForm, setCreateForm] = useState<VehicleForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<VehicleForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: vehicles = [], isLoading } = useQuery<VehicleWithDriver[]>({
    queryKey: ['vehicles'],
    queryFn: () => api.get<VehicleWithDriver[]>('/vehicles'),
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => api.get<Driver[]>('/users?role=DRIVER'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['vehicles'] });

  const createMutation = useMutation({
    mutationFn: (data: VehicleForm) =>
      api.post('/vehicles', {
        plate: data.plate,
        brand: data.brand || undefined,
        model: data.model || undefined,
        capacity: data.capacity ? Number(data.capacity) : undefined,
        driverId: data.driverId || undefined,
      }),
    onSuccess: () => { void invalidate(); setShowCreate(false); setCreateForm(EMPTY_FORM); setCreateError(null); },
    onError: (e: unknown) => setCreateError(e instanceof Error ? e.message : 'Error al crear vehículo'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleForm }) =>
      api.patch(`/vehicles/${id}`, {
        plate: data.plate,
        brand: data.brand || undefined,
        model: data.model || undefined,
        capacity: data.capacity ? Number(data.capacity) : undefined,
        driverId: data.driverId || undefined,
      }),
    onSuccess: () => { void invalidate(); setEditing(null); setEditError(null); },
    onError: (e: unknown) => setEditError(e instanceof Error ? e.message : 'Error al actualizar'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => void invalidate(),
  });

  function openEdit(v: VehicleWithDriver) {
    setEditing(v);
    setEditForm({
      plate: v.plate,
      brand: v.brand ?? '',
      model: v.model ?? '',
      capacity: v.capacity != null ? String(v.capacity) : '',
      driverId: v.driver?.id ?? '',
    });
    setEditError(null);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.plate.trim()) { setCreateError('La placa es requerida'); return; }
    createMutation.mutate(createForm);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    updateMutation.mutate({ id: editing.id, data: editForm });
  }

  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE');
  const inactiveVehicles = vehicles.filter((v) => v.status !== 'ACTIVE');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-[24px] leading-[32px] font-extrabold text-primary">Vehículos</h1>
          <p className="text-[14px] text-on-surface-variant">Gestión de la flota de recolección</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 bg-primary text-on-primary px-3 py-2 rounded-xl text-[13px] font-bold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nuevo vehículo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6 mb-6">
        {[
          { label: 'Total', value: vehicles.length, icon: 'local_shipping' },
          { label: 'Activos', value: activeVehicles.length, icon: 'check_circle' },
          { label: 'Inactivos', value: inactiveVehicles.length, icon: 'cancel' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-surface-card rounded-xl border border-outline-variant/20 p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
            <div>
              <p className="text-[20px] font-extrabold text-on-surface">{value}</p>
              <p className="text-[11px] text-on-surface-variant">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Nuevo vehículo" onClose={() => { setShowCreate(false); setCreateError(null); }}>
          <VehicleFormFields
            form={createForm}
            setForm={setCreateForm}
            drivers={drivers}
            error={createError}
            onSubmit={handleCreate}
            isPending={createMutation.isPending}
            submitLabel="Crear vehículo"
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title={`Editar ${editing.plate}`} onClose={() => setEditing(null)}>
          <VehicleFormFields
            form={editForm}
            setForm={setEditForm}
            drivers={drivers}
            error={editError}
            onSubmit={handleUpdate}
            isPending={updateMutation.isPending}
            submitLabel="Guardar cambios"
          />
        </Modal>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-8 text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-5xl text-outline mb-4">local_shipping</span>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">Sin vehículos</h2>
          <p className="text-on-surface-variant text-sm">Registrá el primer vehículo de la flota.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-surface-card rounded-xl border border-outline-variant/20 p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">local_shipping</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-extrabold text-on-surface">{v.plate}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[v.status] ?? STATUS_COLORS.INACTIVE}`}>
                    {STATUS_LABELS[v.status] ?? v.status}
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant truncate">
                  {[v.brand, v.model].filter(Boolean).join(' ') || 'Sin marca/modelo'}
                  {v.capacity ? ` · ${v.capacity} kg` : ''}
                </p>
                {v.driver && (
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    <span className="material-symbols-outlined text-[11px] align-middle">person</span>{' '}
                    {v.driver.fullName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(v)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
                  title="Editar"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                {v.status === 'ACTIVE' && (
                  <button
                    onClick={() => deactivateMutation.mutate(v.id)}
                    disabled={deactivateMutation.isPending}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-status-alert/10 text-on-surface-variant hover:text-status-alert transition-colors disabled:opacity-40"
                    title="Desactivar"
                  >
                    <span className="material-symbols-outlined text-sm">block</span>
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
