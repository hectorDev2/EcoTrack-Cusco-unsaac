'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DRIVER: 'Conductor',
  CITIZEN: 'Ciudadano',
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

const DAY_ORDER: Record<string, number> = {
  MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7,
};

const WASTE_COLORS: Record<string, string> = {
  ORGANIC: 'bg-waste-organic/10 text-waste-organic border-waste-organic/20',
  RECYCLABLE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  NON_RECYCLABLE: 'bg-waste-non-recyclable/10 text-waste-non-recyclable border-waste-non-recyclable/20',
};

const WASTE_LABELS: Record<string, string> = {
  ORGANIC: 'Orgánico',
  RECYCLABLE: 'Reciclable',
  NON_RECYCLABLE: 'No Reciclable',
};

interface CollectionSchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  wasteType: { id: string; name: string; category: string };
}

interface ZoneRoute {
  id: string;
  status: string;
  driver: { id: string; fullName: string };
  totalStops: number;
  completedStops: number;
}

export default function PerfilPage() {
  const { user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [schedules, setSchedules] = useState<Record<string, CollectionSchedule[]>>({});
  const [zoneRoutes, setZoneRoutes] = useState<Record<string, ZoneRoute[]>>({});
  const [zoneLoading, setZoneLoading] = useState(false);

  useEffect(() => {
    if (!user?.zones?.length) return;

    setZoneLoading(true);
    const zoneIds = user.zones.map((z) => z.id);

    const fetchSchedules = Promise.all(
      zoneIds.map((id) =>
        api.get<{ data: CollectionSchedule[] }>(`/schedules?zoneId=${id}&limit=50`)
          .then((res) => ({ zoneId: id, data: res.data }))
          .catch(() => ({ zoneId: id, data: [] })),
      ),
    );

    const fetchRoutes = Promise.all(
      zoneIds.map((id) =>
        api.get<ZoneRoute[]>(`/routes/zone/${id}`)
          .then((data) => ({ zoneId: id, data }))
          .catch(() => ({ zoneId: id, data: [] })),
      ),
    );

    Promise.all([fetchSchedules, fetchRoutes]).then(([schedResults, routeResults]) => {
      const schedMap: Record<string, CollectionSchedule[]> = {};
      schedResults.forEach((r) => { schedMap[r.zoneId] = r.data; });

      const routeMap: Record<string, ZoneRoute[]> = {};
      routeResults.forEach((r) => { routeMap[r.zoneId] = r.data; });

      setSchedules(schedMap);
      setZoneRoutes(routeMap);
    }).finally(() => setZoneLoading(false));
  }, [user?.zones]);

  if (!user) return null;

  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const startEditing = () => {
    setFullName(user.fullName);
    setPhone(user.phone ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (phone.trim() && !/^\+\d{8,15}$/.test(phone.trim())) {
      setError('El teléfono debe incluir código de país, ej. +51987654321');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { fullName: fullName.trim(), phone: phone.trim() };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      await api.patch('/auth/me', body);
      await refreshProfile();
      setSuccess(true);
      setEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-surface-card rounded-2xl shadow-sm border border-outline-variant p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">person</span>
            </div>
            {editing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-center text-[24px] leading-[32px] font-extrabold text-primary bg-surface-container rounded-xl px-4 py-2 border border-outline-variant/30 w-full outline-none focus:border-primary"
              />
            ) : (
              <h1 className="text-[24px] leading-[32px] font-extrabold text-primary">
                {user.fullName}
              </h1>
            )}
            <span className="mt-2 px-3 py-1 rounded-lg bg-primary-container/20 text-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>

          {error && (
            <div className="mb-6 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-status-alert text-sm">error</span>
              <p className="text-status-alert text-sm font-bold flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-status-alert">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-waste-organic/10 border border-waste-organic/30 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-waste-organic text-sm">check_circle</span>
              <p className="text-waste-organic text-sm font-bold flex-1">Perfil actualizado correctamente</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-1">
                Email
              </label>
              <p className="text-[16px] leading-[24px] text-on-surface">{user.email}</p>
            </div>

            <div>
              <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-1">
                Teléfono (WhatsApp)
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51987654321"
                  className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                />
              ) : (
                <p className="text-[16px] leading-[24px] text-on-surface">
                  {user.phone || 'No configurado'}
                </p>
              )}
              <p className="text-[11px] text-on-surface-variant mt-1">
                Se usa para avisarte por WhatsApp cuando el camión esté por pasar.
              </p>
            </div>

            {editing && (
              <div className="space-y-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em]">
                  Cambiar contraseña
                </p>
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] block mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full bg-surface rounded-xl px-4 py-3 text-[14px] text-on-surface border border-outline-variant/30 outline-none focus:border-primary placeholder:text-outline"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-1">
                Miembro desde
              </label>
              <p className="text-[16px] leading-[24px] text-on-surface">{createdDate}</p>
            </div>

            <div>
              <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-1">
                Estado
              </label>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-waste-organic' : 'bg-waste-non-recyclable'}`} />
                <span className="text-[16px] leading-[24px] text-on-surface">
                  {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-1">
                Zonas asignadas
              </label>
              {user.zones && user.zones.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {user.zones.map((zone) => {
                    const zoneScheds = schedules[zone.id] ?? [];
                    const zoneActiveRoutes = zoneRoutes[zone.id] ?? [];
                    const sortedScheds = [...zoneScheds].sort(
                      (a, b) => (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99)
                        || a.startTime.localeCompare(b.startTime),
                    );

                    return (
                      <div key={zone.id} className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                          <span className="text-[14px] font-bold text-on-surface">{zone.name}</span>
                        </div>

                        {zoneLoading && (
                          <div className="flex items-center gap-2 text-[12px] text-on-surface-variant mb-2">
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Cargando información...
                          </div>
                        )}

                        {!zoneLoading && zoneActiveRoutes.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-2">
                              Rutas activas
                            </p>
                            <div className="space-y-2">
                              {zoneActiveRoutes.map((r) => (
                                <div key={r.id} className="flex items-center gap-2 text-[12px]">
                                  <span className={`w-2 h-2 rounded-full ${r.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-outline'}`} />
                                  <span className="text-on-surface font-bold">{r.driver.fullName}</span>
                                  <span className="text-on-surface-variant">
                                    {r.completedStops}/{r.totalStops} paradas
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    r.status === 'IN_PROGRESS'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-surface-container-high text-on-surface-variant'
                                  }`}>
                                    {r.status === 'IN_PROGRESS' ? 'En curso' : 'Pendiente'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!zoneLoading && sortedScheds.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-2">
                              Horario de recolección
                            </p>
                            <div className="space-y-1.5">
                              {sortedScheds.map((s) => (
                                <div key={s.id} className="flex items-center gap-2 text-[12px]">
                                  <span className="w-16 font-bold text-on-surface flex-shrink-0">
                                    {DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}
                                  </span>
                                  <span className="text-on-surface-variant">
                                    {s.startTime} - {s.endTime}
                                  </span>
                                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold border ${WASTE_COLORS[s.wasteType.category] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
                                    {WASTE_LABELS[s.wasteType.category] ?? s.wasteType.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!zoneLoading && zoneActiveRoutes.length === 0 && sortedScheds.length === 0 && (
                          <p className="text-[12px] text-on-surface-variant">Sin información disponible</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[14px] leading-[20px] text-on-surface-variant mt-1">
                  Sin zonas asignadas
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {editing ? (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 bg-surface-container-high text-on-surface py-3 rounded-xl text-[14px] font-bold active:opacity-80 transition-opacity disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="w-full bg-primary text-on-primary py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar perfil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
