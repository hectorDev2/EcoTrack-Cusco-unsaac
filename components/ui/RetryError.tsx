'use client';

import { useState } from 'react';

interface RetryErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  error?: Error;
}

export function RetryError({
  title = 'Algo salió mal',
  message = 'Hubo un problema al cargar los datos. Por favor, intenta de nuevo.',
  onRetry,
  error,
}: RetryErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-status-alert/10 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-status-alert">error</span>
      </div>
      <h3 className="text-[18px] font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-[14px] text-on-surface-variant mb-6 max-w-xs">
        {message}
      </p>
      {error && (
        <p className="text-[12px] text-outline mb-4 max-w-sm truncate">{error.message}</p>
      )}
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-bold disabled:opacity-50"
        >
          {retrying ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              Reintentando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Reintentar
            </>
          )}
        </button>
      )}
    </div>
  );
}
