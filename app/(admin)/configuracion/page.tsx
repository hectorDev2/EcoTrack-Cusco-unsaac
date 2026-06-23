"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { WasteType, Vehicle } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/Spinner";

// ─── Categorías de residuos ───────────────────────────────────────────────────

const CATEGORIES = ["ORGANIC", "RECYCLABLE", "NON_RECYCLABLE", "HAZARDOUS", "SPECIAL"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  ORGANIC: "Orgánico",
  RECYCLABLE: "Reciclable",
  NON_RECYCLABLE: "No reciclable",
  HAZARDOUS: "Peligroso",
  SPECIAL: "Especial",
};

const CATEGORY_COLORS: Record<Category, string> = {
  ORGANIC: "bg-green-100 text-green-800",
  RECYCLABLE: "bg-blue-100 text-blue-800",
  NON_RECYCLABLE: "bg-gray-100 text-gray-700",
  HAZARDOUS: "bg-red-100 text-red-800",
  SPECIAL: "bg-yellow-100 text-yellow-800",
};

const VEHICLE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  MAINTENANCE: "Mantenimiento",
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] font-bold text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Tipos de residuos ────────────────────────────────────────────────────────

function WasteTypesSection() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WasteType | null>(null);
  const [form, setForm] = useState({ name: "", category: "ORGANIC" as Category, description: "" });

  const { data: wasteTypes = [], isLoading } = useQuery({
    queryKey: ["waste-types"],
    queryFn: () => api.get<WasteType[]>("/waste-types"),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["waste-types"] });

  const createMut = useMutation({
    mutationFn: (data: { name: string; category: string; description?: string }) =>
      api.post<WasteType>("/waste-types", data),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      addToast("success", "Tipo de residuo creado");
    },
    onError: () => addToast("error", "No se pudo crear el tipo de residuo"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WasteType> }) =>
      api.patch<WasteType>(`/waste-types/${id}`, data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      addToast("success", "Tipo de residuo actualizado");
    },
    onError: () => addToast("error", "No se pudo actualizar"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/waste-types/${id}`),
    onSuccess: () => {
      invalidate();
      addToast("success", "Tipo de residuo eliminado");
    },
    onError: () => addToast("error", "No se pudo eliminar"),
  });

  const openCreate = () => {
    setForm({ name: "", category: "ORGANIC", description: "" });
    setShowForm(true);
  };

  const openEdit = (wt: WasteType) => {
    setForm({
      name: wt.name,
      category: (wt.category as Category) || "ORGANIC",
      description: wt.description ?? "",
    });
    setEditing(wt);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="bg-surface-card rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-waste-organic p-2 bg-green-50 rounded-lg">recycling</span>
          <h3 className="text-[20px] font-bold text-on-surface">Tipos de residuos</h3>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[13px] font-bold rounded-full hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo tipo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : wasteTypes.length === 0 ? (
        <p className="text-on-surface-variant text-[14px] text-center py-6">
          No hay tipos de residuos registrados.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {wasteTypes.map((wt) => (
            <div
              key={wt.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
            >
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${CATEGORY_COLORS[wt.category as Category] ?? "bg-gray-100 text-gray-700"}`}
              >
                {CATEGORY_LABELS[wt.category as Category] ?? wt.category}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-on-surface truncate">{wt.name}</p>
                {wt.description && (
                  <p className="text-[12px] text-on-surface-variant truncate">{wt.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(wt)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar "${wt.name}"?`)) deleteMut.mutate(wt.id);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"
                >
                  <span className="material-symbols-outlined text-[18px] text-status-alert">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <Modal
          title={editing ? "Editar tipo de residuo" : "Nuevo tipo de residuo"}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-on-surface-variant">Nombre *</label>
              <input
                className="border border-outline-variant rounded-lg px-3 py-2 text-[14px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Residuos orgánicos"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-on-surface-variant">Categoría</label>
              <select
                className="border border-outline-variant rounded-lg px-3 py-2 text-[14px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-on-surface-variant">
                Descripción (opcional)
              </label>
              <textarea
                className="border border-outline-variant rounded-lg px-3 py-2 text-[14px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción breve..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 text-[13px] font-bold text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || isPending}
                className="px-4 py-2 text-[13px] font-bold text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Spinner size="sm" />}
                {editing ? "Guardar cambios" : "Crear"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Vehículos ────────────────────────────────────────────────────────────────

function VehiclesSection() {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ plate: "", brand: "", model: "", capacity: "" });

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api.get<Vehicle[]>("/vehicles"),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["vehicles"] });

  const createMut = useMutation({
    mutationFn: (data: object) => api.post<Vehicle>("/vehicles", data),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      addToast("success", "Vehículo registrado");
    },
    onError: () => addToast("error", "No se pudo registrar el vehículo"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.patch<Vehicle>(`/vehicles/${id}`, data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      addToast("success", "Vehículo actualizado");
    },
    onError: () => addToast("error", "No se pudo actualizar"),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      invalidate();
      addToast("success", "Vehículo desactivado");
    },
    onError: () => addToast("error", "No se pudo desactivar"),
  });

  const openCreate = () => {
    setForm({ plate: "", brand: "", model: "", capacity: "" });
    setShowForm(true);
  };

  const openEdit = (v: Vehicle) => {
    setForm({
      plate: v.plate,
      brand: v.brand ?? "",
      model: v.model ?? "",
      capacity: v.capacity?.toString() ?? "",
    });
    setEditing(v);
  };

  const handleSubmit = () => {
    const payload = {
      plate: form.plate.trim().toUpperCase(),
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      capacity: form.capacity ? parseFloat(form.capacity) : undefined,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="bg-surface-card rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary p-2 bg-orange-50 rounded-lg">
            local_shipping
          </span>
          <h3 className="text-[20px] font-bold text-on-surface">Vehículos</h3>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[13px] font-bold rounded-full hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo vehículo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : vehicles.length === 0 ? (
        <p className="text-on-surface-variant text-[14px] text-center py-6">
          No hay vehículos registrados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-outline-variant text-on-surface-variant text-left">
                <th className="pb-2 font-bold pr-4">Placa</th>
                <th className="pb-2 font-bold pr-4">Marca / Modelo</th>
                <th className="pb-2 font-bold pr-4">Capacidad</th>
                <th className="pb-2 font-bold pr-4">Conductor</th>
                <th className="pb-2 font-bold pr-4">Estado</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 pr-4 font-mono font-bold text-on-surface">{v.plate}</td>
                  <td className="py-2.5 pr-4 text-on-surface-variant">
                    {[v.brand, v.model].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-on-surface-variant">
                    {v.capacity ? `${v.capacity} kg` : "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-on-surface-variant">
                    {v.driver?.fullName ?? "Sin asignar"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        v.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {VEHICLE_STATUS_LABELS[v.status] ?? v.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(v)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          edit
                        </span>
                      </button>
                      {v.status === "ACTIVE" && (
                        <button
                          onClick={() => {
                            if (confirm(`¿Desactivar vehículo ${v.plate}?`))
                              deactivateMut.mutate(v.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"
                        >
                          <span className="material-symbols-outlined text-[18px] text-status-alert">
                            block
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showForm || editing) && (
        <Modal
          title={editing ? "Editar vehículo" : "Nuevo vehículo"}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-on-surface-variant">Placa *</label>
                <input
                  className="border border-outline-variant rounded-lg px-3 py-2 text-[14px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  value={form.plate}
                  onChange={(e) => setForm({ ...form, plate: e.target.value })}
                  placeholder="ABC-123"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-on-surface-variant">
                  Capacidad (kg)
                </label>
                <input
                  type="number"
                  className="border border-outline-variant rounded-lg px-3 py-2 text-[14px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="1500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-on-surface-variant">Marca</label>
                <input
                  className="border border-outline-variant rounded-lg px-3 py-2 text-[14px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-on-surface-variant">Modelo</label>
                <input
                  className="border border-outline-variant rounded-lg px-3 py-2 text-[14px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Hilux"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 text-[13px] font-bold text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.plate.trim() || isPending}
                className="px-4 py-2 text-[13px] font-bold text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Spinner size="sm" />}
                {editing ? "Guardar cambios" : "Registrar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Parámetros del sistema ───────────────────────────────────────────────────

function SystemParamsSection() {
  const params = [
    {
      icon: "gps_fixed",
      label: "Intervalo de tracking GPS",
      value: "Cada 15 s (activo) / 20 m (distancia)",
      color: "text-primary",
    },
    { icon: "sync", label: "Polling flota admin", value: "Cada 5 s", color: "text-primary" },
    {
      icon: "timer",
      label: "Sesión JWT",
      value: "7 días (sin refresh token)",
      color: "text-secondary",
    },
    {
      icon: "security",
      label: "Rate limiting — login",
      value: "10 intentos / minuto",
      color: "text-tertiary",
    },
    {
      icon: "security",
      label: "Rate limiting — registro",
      value: "5 intentos / minuto",
      color: "text-tertiary",
    },
    { icon: "language", label: "Idioma del sistema", value: "Español (Perú)", color: "text-primary" },
    {
      icon: "public",
      label: "Zona horaria",
      value: "GMT-05:00 (Lima/Cusco)",
      color: "text-primary",
    },
    {
      icon: "database",
      label: "Base de datos",
      value: "Turso (libSQL edge)",
      color: "text-waste-organic",
    },
  ];

  return (
    <div className="bg-surface-card rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-tertiary p-2 bg-yellow-50 rounded-lg">tune</span>
        <div>
          <h3 className="text-[20px] font-bold text-on-surface">Parámetros del sistema</h3>
          <p className="text-[12px] text-on-surface-variant">
            Solo lectura — configurable en variables de entorno
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {params.map((p) => (
          <div
            key={p.label}
            className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low"
          >
            <span className={`material-symbols-outlined text-[20px] mt-0.5 ${p.color}`}>
              {p.icon}
            </span>
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
                {p.label}
              </p>
              <p className="text-[14px] font-semibold text-on-surface">{p.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-[13px]">
        <span className="material-symbols-outlined text-[18px]">info</span>
        Para cambiar estos parámetros, actualiza las variables de entorno en Render (backend) o
        Vercel (frontend) y redeploy.
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[28px] font-extrabold text-primary leading-tight">Configuración</h2>
            <p className="text-[15px] text-on-surface-variant">
              Gestión de tipos de residuos, vehículos y parámetros del sistema.
            </p>
          </div>

          <WasteTypesSection />
          <VehiclesSection />
          <SystemParamsSection />
        </div>
      </div>
    </div>
  );
}
