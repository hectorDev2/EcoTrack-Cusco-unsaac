'use client';

import { AuthProvider } from '@/lib/auth-context';
import { QueryProvider } from '@/lib/query-provider';
import { ToastProvider } from '@/components/ui/Toast';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
        <OfflineBanner />
      </AuthProvider>
    </QueryProvider>
  );
}
