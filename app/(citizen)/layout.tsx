'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

const roleHome: Record<string, string> = {
  ADMIN: '/dashboard',
  CITIZEN: '/inicio',
  DRIVER: '/conductor/dashboard',
};

function CitizenGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (user.role !== 'CITIZEN') {
      router.replace(roleHome[user.role] ?? '/');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-bold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'CITIZEN') return null;

  return <>{children}</>;
}

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <CitizenGuard>
      <div className="min-h-screen bg-background text-on-background pb-32 font-sans">
        {children}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center gap-0.5 px-1.5 pb-4 pt-2 bg-surface-container border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(45,90,39,0.08)] rounded-t-xl overflow-x-auto">
          <Link className="flex flex-col items-center justify-center flex-shrink-0 bg-primary-container text-on-primary-container rounded-full px-2 py-1 active:scale-90 transition-all duration-150" href="/inicio">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            <span className="text-[10px] leading-[14px] tracking-[0.03em] font-bold">Inicio</span>
          </Link>
          <Link className="flex flex-col items-center justify-center flex-shrink-0 text-on-surface-variant px-2 py-1 hover:bg-primary-container/20 transition-colors active:scale-90 transition-all duration-150" href="/mapa">
            <span className="material-symbols-outlined">distance</span>
            <span className="text-[10px] leading-[14px] tracking-[0.03em] font-bold">Mapa</span>
          </Link>
          <Link className="flex flex-col items-center justify-center flex-shrink-0 text-on-surface-variant px-2 py-1 hover:bg-primary-container/20 transition-colors active:scale-90 transition-all duration-150" href="/reportar">
            <span className="material-symbols-outlined">report_problem</span>
            <span className="text-[10px] leading-[14px] tracking-[0.03em] font-bold">Reportar</span>
          </Link>
          <Link className="flex flex-col items-center justify-center flex-shrink-0 text-on-surface-variant px-2 py-1 hover:bg-primary-container/20 transition-colors active:scale-90 transition-all duration-150" href="/alarmas">
            <span className="material-symbols-outlined">add_alert</span>
            <span className="text-[10px] leading-[14px] tracking-[0.03em] font-bold">Alarmas</span>
          </Link>
          <Link className="flex flex-col items-center justify-center flex-shrink-0 text-on-surface-variant px-2 py-1 hover:bg-primary-container/20 transition-colors active:scale-90 transition-all duration-150" href="/residuos">
            <span className="material-symbols-outlined">delete</span>
            <span className="text-[10px] leading-[14px] tracking-[0.03em] font-bold">Residuos</span>
          </Link>
          <Link className="flex flex-col items-center justify-center flex-shrink-0 text-on-surface-variant px-2 py-1 hover:bg-primary-container/20 transition-colors active:scale-90 transition-all duration-150" href="/perfil">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] leading-[14px] tracking-[0.03em] font-bold">Perfil</span>
          </Link>
          <button onClick={handleLogout} className="flex flex-col items-center justify-center flex-shrink-0 text-on-surface-variant px-2 py-1 hover:bg-error/10 hover:text-error transition-colors active:scale-90 transition-all duration-150">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-[10px] leading-[14px] tracking-[0.03em] font-bold">Salir</span>
          </button>
          <div className="flex flex-col items-center justify-center flex-shrink-0 px-1 py-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </CitizenGuard>
  );
}
