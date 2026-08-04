'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ApiClientError } from '@/lib/api';
import type { User, UserStats, PaginatedResponse } from '@/lib/types';

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-primary-container/20 text-primary',
  DRIVER: 'bg-secondary-container/30 text-secondary',
  CITIZEN: 'bg-surface-container-highest text-on-surface-variant',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DRIVER: 'Conductor',
  CITIZEN: 'Ciudadano',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatNumber(n: number): string {
  return n >= 1000 ? `${Math.floor(n / 1000)},${String(n % 1000).padStart(3, '0')}` : String(n);
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [editModal, setEditModal] = useState<{ user: User } | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', role: '', status: '', password: '' });
  const [editZoneIds, setEditZoneIds] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', fullName: '', role: 'CITIZEN' });
  const [createZoneIds, setCreateZoneIds] = useState<string[]>([]);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchData = useCallback(async (page: number, searchTerm: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (searchTerm) params.set('search', searchTerm);

      const [usersRes, statsRes] = await Promise.all([
        api.get<PaginatedResponse<User>>(`/users?${params}`),
        api.get<UserStats>('/users/stats'),
      ]);

      setUsers(usersRes.data);
      setMeta(usersRes.meta);
      setStats(statsRes);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Error al cargar usuarios');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
     
    fetchData(1, '');
    api.get<{ id: string; name: string }[]>('/zones').then(setZones).catch(() => {});
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchData(1, value);
    }, 400);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > meta.totalPages) return;
    fetchData(page, search);
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`¿Desactivar al usuario "${name}"?`)) return;

    try {
      await api.delete(`/users/${id}`);
      fetchData(meta.page, search);
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert('Error al desactivar usuario');
      }
    }
  };

  const openEditModal = (user: User) => {
    setEditModal({ user });
    setEditForm({ fullName: user.fullName, role: user.role, status: user.status, password: '' });
    setEditZoneIds(user.zones.map((z) => z.id));
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditModal(null);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    setEditError(null);

    if (!editForm.fullName.trim()) {
      setEditError('El nombre no puede estar vacío');
      return;
    }

    setEditSaving(true);
    try {
      const body: Record<string, string> = {
        fullName: editForm.fullName.trim(),
        role: editForm.role,
        status: editForm.status,
      };
      if (editForm.password) body.password = editForm.password;

      await Promise.all([
        api.patch(`/users/${editModal.user.id}`, body),
        editZoneIds.length > 0
          ? api.patch(`/users/${editModal.user.id}/zones`, { zoneIds: editZoneIds })
          : Promise.resolve(),
      ]);
      closeEditModal();
      fetchData(meta.page, search);
    } catch (err) {
      setEditError(err instanceof ApiClientError ? err.message : 'Error al guardar');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateSave = async () => {
    setCreateError(null);
    if (!createForm.email.trim() || !createForm.password || !createForm.fullName.trim()) {
      setCreateError('Todos los campos son obligatorios');
      return;
    }
    setCreateSaving(true);
    try {
      const res = await api.post<{ user: User }>('/users', createForm);
      if (createZoneIds.length > 0) {
        await api.patch(`/users/${res.user.id}/zones`, { zoneIds: createZoneIds });
      }
      setCreateModal(false);
      setCreateForm({ email: '', password: '', fullName: '', role: 'CITIZEN' });
      setCreateZoneIds([]);
      fetchData(meta.page, search);
    } catch (err) {
      setCreateError(err instanceof ApiClientError ? err.message : 'Error al crear usuario');
    } finally {
      setCreateSaving(false);
    }
  };

  const toggleZone = (zoneId: string, selected: string[], setter: (ids: string[]) => void) => {
    setter(selected.includes(zoneId) ? selected.filter((id) => id !== zoneId) : [...selected, zoneId]);
  };

  const statCards = stats
    ? [
        { label: 'Total Usuarios', value: formatNumber(stats.total), icon: 'group', color: 'bg-primary-container/20 text-primary' },
        { label: 'Activos', value: formatNumber(stats.active), icon: 'check_circle', color: 'bg-waste-organic/20 text-waste-organic' },
        { label: 'Conductores', value: formatNumber(stats.drivers), icon: 'local_shipping', color: 'bg-secondary-container/20 text-secondary' },
        { label: 'Administradores', value: formatNumber(stats.admins), icon: 'admin_panel_settings', color: 'bg-status-alert/20 text-status-alert' },
      ]
    : [];

  const from = meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="bg-surface border-b border-outline-variant shadow-sm flex justify-between items-center w-full px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-6 flex-1">
          <h2 className="text-[24px] leading-[32px] font-extrabold text-primary">
            Eco Track Wanchaq
          </h2>
          <div className="max-w-md w-full relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-md text-[14px] leading-[20px] focus:ring-2 focus:ring-primary"
              placeholder="Buscar por nombre o email..."
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">help</span>
          </button>
          <div className="h-8 w-[1px] bg-outline-variant mx-2" />
          <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low p-1 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full border-2 border-primary-fixed bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">Admin Cusco</span>
          </div>
        </div>
      </header>

      <div className="p-6 overflow-auto flex-1">
        <div className="max-w-[1440px] mx-auto space-y-lg">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
                Gestión de Usuarios
              </h3>
              <p className="text-on-surface-variant text-[16px] leading-[24px] mt-1">
                Administra los permisos y zonas de acceso para ciudadanos y personal municipal.
              </p>
            </div>
            <button
              onClick={() => { setCreateModal(true); setCreateForm({ email: '', password: '', fullName: '', role: 'CITIZEN' }); setCreateZoneIds([]); setCreateError(null); }}
              className="bg-primary text-on-primary px-6 py-4 rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-2 hover:shadow-md transition-shadow"
            >
              <span className="material-symbols-outlined">person_add</span>
              Agregar Usuario
            </button>
          </div>

          {error && (
            <div className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-status-alert">error</span>
              <p className="text-status-alert text-[14px] leading-[20px] font-bold">{error}</p>
              <button
                onClick={() => fetchData(meta.page, search)}
                className="ml-auto text-status-alert underline text-[12px] leading-[16px] font-bold"
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-card p-4 rounded-xl shadow-sm border border-outline-variant flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.05em] font-bold uppercase">
                    {stat.label}
                  </p>
                  <p className="text-[24px] leading-[32px] font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-6">
            <div className="flex-1 bg-surface-card rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-on-surface-variant text-[14px] leading-[20px] font-bold">
                      Cargando usuarios...
                    </p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-outline">people_outline</span>
                    <p className="text-on-surface-variant text-[14px] leading-[20px] font-bold">
                      {search ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant">
                          <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Nombre</th>
                          <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Email</th>
                          <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Rol</th>
                          <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Zona</th>
                          <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Estado</th>
                          <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-surface-container transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                  {getInitials(user.fullName)}
                                </div>
                                <span className="text-[16px] leading-[24px] font-bold">{user.fullName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-on-surface-variant text-[14px] leading-[20px]">
                              {user.email}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-sm py-xs rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold ${ROLE_STYLES[user.role] ?? ''}`}>
                                {ROLE_LABELS[user.role] ?? user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[14px] leading-[20px] text-on-surface-variant">
                              {user.zones.map((z) => z.name).join(', ') || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <div className={`flex items-center gap-1 ${user.status === 'ACTIVE' ? 'text-waste-organic' : 'text-waste-non-recyclable'}`}>
                                <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-waste-organic' : 'bg-waste-non-recyclable'}`} />
                                <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                                  {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-1 text-outline hover:text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              {user.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleDeactivate(user.id, user.fullName)}
                                  className="p-1 text-outline hover:text-error transition-colors"
                                >
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant">
                    <span className="text-[14px] leading-[20px] text-on-surface-variant">
                      Mostrando {from}-{to} de {formatNumber(meta.total)} usuarios
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(meta.page - 1)}
                        disabled={meta.page <= 1}
                        className="p-2 rounded-lg hover:bg-surface-container-high text-outline transition-colors disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                        const start = Math.max(1, meta.page - 2);
                        const pageNum = start + i;
                        if (pageNum > meta.totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold ${
                              pageNum === meta.page
                                ? 'bg-primary text-on-primary'
                                : 'hover:bg-surface-container-high'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(meta.page + 1)}
                        disabled={meta.page >= meta.totalPages}
                        className="p-2 rounded-lg hover:bg-surface-container-high text-outline transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeEditModal}>
          <div className="bg-surface-card rounded-2xl shadow-xl border border-outline-variant w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-extrabold text-primary">Editar usuario</h3>
              <button onClick={closeEditModal} className="p-1 text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {editError && (
              <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-status-alert text-sm">error</span>
                <p className="text-status-alert text-sm font-bold flex-1">{editError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Nombre</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Email</label>
                <p className="text-[14px] text-on-surface-variant px-1">{editModal.user.email}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary"
                >
                  <option value="CITIZEN">Ciudadano</option>
                  <option value="DRIVER">Conductor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Estado</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Zonas</label>
                <div className="flex flex-wrap gap-2">
                  {zones.map((z) => {
                    const selected = editZoneIds.includes(z.id);
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => toggleZone(z.id, editZoneIds, setEditZoneIds)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                          selected
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-surface text-on-surface-variant border-outline-variant/30 hover:border-outline-variant'
                        }`}
                      >
                        {z.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Nueva contraseña <span className="text-on-surface-variant/50">(opcional)</span></label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mín. 6 caracteres"
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeEditModal}
                disabled={editSaving}
                className="flex-1 bg-surface-container-high text-on-surface py-3 rounded-xl text-[14px] font-bold active:opacity-80 transition-opacity disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
              >
                {editSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCreateModal(false)}>
          <div className="bg-surface-card rounded-2xl shadow-xl border border-outline-variant w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-extrabold text-primary">Agregar usuario</h3>
              <button onClick={() => setCreateModal(false)} className="p-1 text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {createError && (
              <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-status-alert text-sm">error</span>
                <p className="text-status-alert text-sm font-bold flex-1">{createError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Nombre</label>
                <input type="text" value={createForm.fullName} onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Email</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Contraseña</label>
                <input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mín. 6 caracteres"
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Rol</label>
                <select value={createForm.role} onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary">
                  <option value="CITIZEN">Ciudadano</option>
                  <option value="DRIVER">Conductor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">Zonas</label>
                <div className="flex flex-wrap gap-2">
                  {zones.map((z) => {
                    const selected = createZoneIds.includes(z.id);
                    return (
                      <button key={z.id} type="button"
                        onClick={() => toggleZone(z.id, createZoneIds, setCreateZoneIds)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                          selected ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface text-on-surface-variant border-outline-variant/30 hover:border-outline-variant'
                        }`}
                      >
                        {z.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setCreateModal(false)} disabled={createSaving}
                className="flex-1 bg-surface-container-high text-on-surface py-3 rounded-xl text-[14px] font-bold active:opacity-80 transition-opacity disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleCreateSave} disabled={createSaving}
                className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50">
                {createSaving ? (
                  <><div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />Guardando...</>
                ) : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full py-6 px-xl flex justify-between items-center max-w-[1440px] mx-auto bg-surface-container border-t border-outline-variant">
        <p className="text-[14px] leading-[20px] text-on-surface-variant">© 2026 Municipalidad de Wanchaq - Gestión de Residuos</p>
        <div className="flex gap-6">
          <a className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors" href="#">Política de Privacidad</a>
          <a className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors" href="#">Soporte</a>
          <a className="text-[14px] leading-[20px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" href="#">
            <span className="w-2 h-2 rounded-full bg-waste-organic" />
            Estado del Sistema: Operativo
          </a>
        </div>
      </footer>
    </div>
  );
}
