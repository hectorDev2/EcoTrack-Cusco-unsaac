'use client';

import { useState, useEffect } from 'react';
import { api, ApiClientError } from '@/lib/api';
import type { WasteType } from '@/lib/types';

const categoryColors: Record<string, string> = {
  ORGANIC: 'bg-waste-organic/10 text-waste-organic border-waste-organic/20',
  RECYCLABLE: 'bg-waste-recyclable/10 text-waste-recyclable border-waste-recyclable/20',
  NON_RECYCLABLE: 'bg-waste-non-recyclable/10 text-waste-non-recyclable border-waste-non-recyclable/20',
  HAZARDOUS: 'bg-status-alert/10 text-status-alert border-status-alert/20',
};

const categoryIcons: Record<string, string> = {
  ORGANIC: 'eco',
  RECYCLABLE: 'recycling',
  NON_RECYCLABLE: 'delete',
  HAZARDOUS: 'warning',
};

const categoryLabels: Record<string, string> = {
  ORGANIC: 'Orgánico',
  RECYCLABLE: 'Reciclable',
  NON_RECYCLABLE: 'No Reciclable',
  HAZARDOUS: 'Peligroso',
};

export default function AdminResiduosPage() {
  const [items, setItems] = useState<WasteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WasteType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('ORGANIC');
  const [formDescription, setFormDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get<WasteType[]>('/waste-types')
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormCategory('ORGANIC');
    setFormDescription('');
    setShowForm(true);
  };

  const openEdit = (wt: WasteType) => {
    setEditing(wt);
    setFormName(wt.name);
    setFormCategory(wt.category);
    setFormDescription(wt.description ?? '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setFormLoading(true);
    try {
      if (editing) {
        await api.patch(`/waste-types/${editing.id}`, { name: formName.trim(), category: formCategory, description: formDescription.trim() || undefined });
      } else {
        await api.post('/waste-types', { name: formName.trim(), category: formCategory, description: formDescription.trim() || undefined });
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este tipo de residuo?')) return;
    try {
      await api.delete(`/waste-types/${id}`);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al eliminar');
    }
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] leading-[32px] font-bold text-primary">Tipos de Residuo</h2>
          <p className="text-[14px] text-on-surface-variant">Gestiona las categorías de residuos del sistema</p>
        </div>
        <button onClick={openCreate}
          className="bg-primary text-on-primary px-5 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2 active:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo Tipo
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-status-alert text-sm">error</span>
          <p className="text-status-alert text-sm font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-status-alert">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-surface-card rounded-xl p-6 border border-outline-variant/20">
          <h3 className="text-[18px] font-bold text-on-surface mb-4">{editing ? 'Editar' : 'Nuevo'} Tipo de Residuo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Nombre</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Orgánico"
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Categoría</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none">
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-[0.08em] text-on-surface-variant uppercase block mb-2">Descripción</label>
              <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descripción opcional"
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl border border-outline-variant text-[13px] font-bold text-on-surface-variant">Cancelar</button>
            <button onClick={handleSave} disabled={!formName.trim() || formLoading}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl text-[13px] font-bold flex items-center gap-2 disabled:opacity-50">
              {formLoading ? <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> : null}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm font-bold">Cargando...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="col-span-full bg-surface-card rounded-xl p-8 text-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">delete</span>
              <p className="text-on-surface-variant text-sm">No hay tipos de residuo</p>
            </div>
          )}
          {items.map((wt) => (
            <div key={wt.id} className={`bg-surface-card rounded-xl border p-5 ${categoryColors[wt.category] ?? 'bg-surface-container-high'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[wt.category] ?? 'bg-surface-container-high'}`}>
                    <span className="material-symbols-outlined text-[20px]">{categoryIcons[wt.category] ?? 'delete'}</span>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-on-surface">{wt.name}</h3>
                    <span className="text-[11px] text-on-surface-variant">{categoryLabels[wt.category] ?? wt.category}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(wt)}
                    className="p-1.5 rounded hover:bg-surface-variant text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button onClick={() => handleDelete(wt.id)}
                    className="p-1.5 rounded hover:bg-error/10 text-error">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
              {wt.description && (
                <p className="text-[12px] text-on-surface-variant leading-relaxed">{wt.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
