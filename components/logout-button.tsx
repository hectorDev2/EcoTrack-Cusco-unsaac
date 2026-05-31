'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors rounded-lg w-full"
    >
      <span className="material-symbols-outlined">logout</span>
      <span className="text-[16px] leading-[24px]">{user?.fullName ?? 'Cerrar sesión'}</span>
    </button>
  );
}
