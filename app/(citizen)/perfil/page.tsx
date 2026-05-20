'use client';

import { useAuth } from '@/lib/auth-context';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DRIVER: 'Conductor',
  CITIZEN: 'Ciudadano',
};

export default function PerfilPage() {
  const { user } = useAuth();

  if (!user) return null;

  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-surface-card rounded-2xl shadow-sm border border-outline-variant p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">
                person
              </span>
            </div>
            <h1 className="text-[24px] leading-[32px] font-extrabold text-primary">
              {user.fullName}
            </h1>
            <span className="mt-2 px-3 py-1 rounded-lg bg-primary-container/20 text-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] leading-[14px] tracking-[0.08em] font-bold text-on-surface-variant uppercase block mb-1">
                Email
              </label>
              <p className="text-[16px] leading-[24px] text-on-surface">{user.email}</p>
            </div>

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
                <ul className="space-y-2 mt-2">
                  {user.zones.map((zone) => (
                    <li
                      key={zone.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low text-[14px] leading-[20px]"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                      {zone.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] leading-[20px] text-on-surface-variant mt-1">
                  Sin zonas asignadas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
