'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const roleHome: Record<string, string> = {
  ADMIN: '/dashboard',
  CITIZEN: '/inicio',
  DRIVER: '/conductor/dashboard',
};

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (user.role !== 'ADMIN') {
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

  if (!user || user.role !== 'ADMIN') return null;

  return <>{children}</>;
}
