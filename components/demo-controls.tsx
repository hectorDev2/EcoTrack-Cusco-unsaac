'use client';

import { useState, useEffect } from 'react';
import { api, ApiClientError } from '@/lib/api';

interface DemoStatus {
  running: boolean;
  currentIndex?: number;
  totalTicks?: number;
  progressPercent?: number;
}

export default function DemoControls({ routeId }: { routeId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<DemoStatus>({ running: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ enabled: boolean }>('/demo/enabled')
      .then((res) => setEnabled(res.enabled))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (!enabled || !status.running) return;
    const interval = setInterval(() => {
      api.get<DemoStatus>(`/demo/routes/${routeId}/status`)
        .then(setStatus)
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [enabled, status.running, routeId]);

  if (!enabled) return null;

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/demo/routes/${routeId}/start`, {});
      setStatus({ running: true, currentIndex: 0, totalTicks: 0, progressPercent: 0 });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al iniciar la demo');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/demo/routes/${routeId}/stop`);
      setStatus({ running: false });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al detener la demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-dashed border-secondary/50 rounded-xl p-3 mt-3 bg-secondary/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-secondary text-sm">movie</span>
        <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.08em]">Modo Demo</span>
      </div>

      {status.running ? (
        <>
          <div className="w-full bg-surface-container-high rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-secondary h-full transition-all"
              style={{ width: `${status.progressPercent ?? 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-on-surface-variant">
              Simulando movimiento... {status.progressPercent ?? 0}%
            </span>
            <button
              onClick={handleStop}
              disabled={loading}
              className="px-3 py-1.5 bg-status-alert/10 text-status-alert rounded-lg text-[12px] font-bold disabled:opacity-50"
            >
              Detener Demo
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary/10 text-secondary rounded-xl text-[13px] font-bold disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">play_circle</span>
          {loading ? 'Iniciando...' : 'Iniciar Demo (simular movimiento)'}
        </button>
      )}

      {error && <p className="text-status-alert text-[11px] mt-1.5">{error}</p>}
    </div>
  );
}
