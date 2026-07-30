'use client';

import { useEffect, useState } from 'react';
import { getToken } from './api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = (apiUrl ?? '').replace(/\/+$/, '');

export interface LivePosition {
  lat: number;
  lng: number;
  index: number;
  total: number;
}

export interface RouteAlert {
  /** Nombre del punto de recojo más cercano a la casa del usuario. */
  name: string;
  /** A cuántas paradas está el camión de ese punto. */
  stopsAway: number;
  /** Marca temporal para poder re-mostrar el aviso si llega otro. */
  at: number;
}

export interface RouteLiveState {
  /** Última posición del camión empujada por el servidor (o null si no hay). */
  position: LivePosition | null;
  /** IDs de RouteStop marcadas COMPLETED en vivo durante esta sesión. */
  completedStopIds: Set<string>;
  /** Nombre de la última parada completada (para un aviso puntual). */
  lastCompletedName: string | null;
  /** Aviso anticipado dirigido a ESTE usuario ("a N paradas de tu casa"). */
  alert: RouteAlert | null;
  /** Si hay una demo corriendo para esta ruta según el stream. */
  running: boolean;
  /** Si el stream SSE está conectado ahora mismo. */
  connected: boolean;
}

/**
 * Suscribe la vista al stream en vivo (SSE) de una ruta: posición del camión,
 * paradas completadas y estado de la demo — empujado por el servidor, sin
 * polling a la base. Lo usan los 3 roles a la vez (admin, conductor,
 * ciudadano), así que todos ven moverse el camión en simultáneo.
 *
 * `EventSource` reconecta solo ante una caída; solo hay que cerrarlo al
 * desmontar o al cambiar de ruta.
 */
export function useRouteLive(
  routeId: string | null | undefined,
  enabled = true,
  userId?: string | null,
): RouteLiveState {
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [completedStopIds, setCompletedStopIds] = useState<Set<string>>(new Set());
  const [lastCompletedName, setLastCompletedName] = useState<string | null>(null);
  const [alert, setAlert] = useState<RouteAlert | null>(null);
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Al cambiar de ruta (o apagarse), arrancar de cero.
    setPosition(null);
    setCompletedStopIds(new Set());
    setLastCompletedName(null);
    setAlert(null);
    setRunning(false);
    setConnected(false);

    if (!enabled || !routeId || !API_URL) return;
    const token = getToken();
    if (!token) return;

    const url = `${API_URL}/live/routes/${routeId}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false); // EventSource reintenta solo

    es.onmessage = (e) => {
      let data: {
        type: string;
        lat?: number;
        lng?: number;
        index?: number;
        total?: number;
        stopId?: string;
        name?: string;
        running?: boolean;
        userId?: string;
        stopsAway?: number;
      };
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }

      if (data.type === 'position' && data.lat != null && data.lng != null) {
        setPosition({ lat: data.lat, lng: data.lng, index: data.index ?? 0, total: data.total ?? 0 });
      } else if (data.type === 'stop' && data.stopId) {
        const stopId = data.stopId;
        setCompletedStopIds((prev) => {
          const next = new Set(prev);
          next.add(stopId);
          return next;
        });
        if (data.name) setLastCompletedName(data.name);
      } else if (data.type === 'status') {
        setRunning(!!data.running);
        if (!data.running) setPosition(null);
      } else if (data.type === 'alarm' && data.name && data.userId && data.userId === userId) {
        // Aviso anticipado dirigido a este usuario.
        setAlert({ name: data.name, stopsAway: data.stopsAway ?? 0, at: Date.now() });
      }
      // type === 'ping' → latido, se ignora
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [routeId, enabled, userId]);

  return { position, completedStopIds, lastCompletedName, alert, running, connected };
}
