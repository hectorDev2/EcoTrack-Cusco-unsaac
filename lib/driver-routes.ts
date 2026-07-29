'use client';

import { useEffect, useState } from 'react';

export interface DriverRouteStop {
  id: string;
  orderIndex: number;
  status: string;
  pickupPoint: { id: string; name: string; address: string; latitude: number; longitude: number };
}

export interface DriverRoute {
  id: string;
  name: string | null;
  shift: string | null;
  frequency: string | null;
  zone: { id: string; name: string };
  status: string;
  totalStops: number;
  completedStops: number;
  startedAt: string | null;
  createdAt: string;
  stops: DriverRouteStop[];
  currentLocation: { latitude: number; longitude: number; recordedAt: string } | null;
}

export const SHIFT_LABELS: Record<string, string> = {
  MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche', DOMINICAL: 'Dominical',
};

const STORAGE_KEY = 'ecotrack:driver:selectedRouteId';

/**
 * Elige, entre varias rutas (zonas/turnos) a cargo del conductor, la que
 * corresponde mostrar por defecto: la que está en curso, o si no hay
 * ninguna, la pendiente más próxima según el orden de turno — el backend ya
 * las devuelve ordenadas así (ver SHIFT_ORDER en routes.service.ts).
 */
function pickDefaultRoute(routes: DriverRoute[]): DriverRoute | null {
  return (
    routes.find((r) => r.status === 'IN_PROGRESS') ??
    routes.find((r) => r.status === 'PENDING') ??
    routes[0] ??
    null
  );
}

/**
 * Mantiene cuál de las rutas del conductor está seleccionada, persistida en
 * localStorage para que sobreviva a la navegación entre /conductor/dashboard,
 * /conductor/ruta y /conductor/mapa. Si la ruta guardada ya no existe en la
 * lista (terminó, fue reasignada, etc.) vuelve a elegir un default.
 */
export function useSelectedDriverRoute(routes: DriverRoute[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (routes.length === 0) return;
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    const stillValid = stored && routes.some((r) => r.id === stored);
    if (stillValid) {
      setSelectedId(stored);
    } else {
      setSelectedId(pickDefaultRoute(routes)?.id ?? null);
    }
    // Solo re-evaluar cuando cambia el SET de rutas disponibles, no en cada
    // poll donde solo cambian sus paradas/ubicación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes.map((r) => `${r.id}:${r.status}`).join(',')]);

  const selectRoute = (id: string) => {
    setSelectedId(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedRoute = routes.find((r) => r.id === selectedId) ?? pickDefaultRoute(routes);

  return { selectedRoute, selectRoute };
}
