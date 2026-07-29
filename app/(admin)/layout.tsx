'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminShell } from './admin-shell';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Panel' },
  { href: '/admin-incidencias', icon: 'report_problem', label: 'Incidencias' },
  { href: '/vehiculos', icon: 'directions_bus', label: 'Vehículos' },
  { href: '/admin-rutas', icon: 'route', label: 'Rutas' },
  { href: '/analisis', icon: 'bar_chart', label: 'Analíticas' },
  { href: '/usuarios', icon: 'group', label: 'Usuarios' },
  { href: '/admin-residuos', icon: 'delete', label: 'Residuos' },
  { href: '/notificaciones', icon: 'notifications', label: 'Notificaciones' },
  { href: '/configuracion', icon: 'settings', label: 'Configuración' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <AdminShell>
      <div className="bg-background text-on-surface min-h-screen flex">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-xl bg-surface-card border border-outline-variant/30 shadow-md text-on-surface"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col p-4 border-r border-outline-variant bg-surface-container shadow-lg shadow-primary/10 transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-sm">recycling</span>
              </div>
              <div>
                <h1 className="text-[18px] leading-[24px] font-extrabold text-primary">
                  Eco Track Wanchaq
                </h1>
                <p className="text-[9px] tracking-[0.08em] font-extrabold text-on-surface-variant/70 uppercase">
                  Admin
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-[14px] font-bold transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-variant/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-outline-variant pt-3">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] font-bold text-on-surface-variant">Apariencia</span>
              <ThemeToggle />
            </div>
            <LogoutButton />
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminShell>
  );
}
