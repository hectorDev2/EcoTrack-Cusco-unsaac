'use client';

import { useOfflineStatus } from '@/hooks/use-offline-status';

export function OfflineBanner() {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-status-alert text-white py-3 px-4 z-[9998] flex items-center justify-center gap-3 shadow-lg">
      <span className="material-symbols-outlined">wifi_off</span>
      <p className="text-[14px] font-bold">Sin conexión — algunos datos pueden estar desactualizados</p>
    </div>
  );
}
