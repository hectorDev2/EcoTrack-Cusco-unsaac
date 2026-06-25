'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

const roleHome: Record<string, string> = {
  ADMIN: '/dashboard',
  CITIZEN: '/inicio',
  DRIVER: '/conductor/dashboard',
};

function DriverGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (user.role !== 'DRIVER') {
      router.replace(roleHome[user.role] ?? '/');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-bold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'DRIVER') return null;
  return <>{children}</>;
}

const navItems = [
  { href: '/conductor/dashboard', icon: 'dashboard', label: 'Mi Ruta' },
  { href: '/conductor/mapa', icon: 'map', label: 'Mapa' },
  { href: '/conductor/ruta', icon: 'route', label: 'Paradas' },
];

export default function ConductorLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DriverGuard>
      <div className="bg-background text-on-surface min-h-screen flex flex-col">
        <header className="bg-surface border-b border-outline-variant/30 px-5 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-sm">local_shipping</span>
            </div>
            <div>
              <h1 className="text-[18px] leading-[24px] font-extrabold text-primary">Eco Track Wanchaq</h1>
              <p className="text-[10px] tracking-[0.08em] font-bold text-on-surface-variant/70 uppercase">Conductor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => { logout(); router.push('/auth/login'); }}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-status-alert/10 hover:text-status-alert transition-colors"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-[12px] font-bold">
              {user?.fullName?.charAt(0) ?? 'C'}
            </div>
          </div>
        </header>

        <nav className="bg-surface-container px-5 py-2 flex gap-2 overflow-x-auto sticky top-[60px] z-40">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold tracking-[0.05em] transition-colors whitespace-nowrap ${
                pathname === item.href
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-5 max-w-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </DriverGuard>
  );
}
