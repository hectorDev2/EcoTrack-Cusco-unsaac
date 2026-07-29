export interface RouteWaypoint {
  lng: number;
  lat: number;
  label?: string;
  pickupPointId?: string;
}

export interface CalculatedRoute {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const OSRM_TIMEOUT_MS = 8000;
const OSRM_RETRIES = 2;

/**
 * Sin esto, una sola falla de red (timeout, DNS, etc.) dejaba `routePath` en
 * `null` para siempre — el marker del camión pierde su polyline de
 * referencia y pasa a animarse en línea recta entre dos posiciones GPS
 * (cortando por encima de manzanas) en vez de seguir la calle. Reintentar
 * con backoff corto cubre los cortes de red transitorios, que son mucho más
 * comunes que un fallo real de OSRM.
 */
export async function calculateRoute(waypoints: RouteWaypoint[]): Promise<CalculatedRoute | null> {
  if (waypoints.length < 2) return null;

  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  // continue_straight=false: por defecto OSRM evita giros en U en los waypoints
  // intermedios, así que una parada en un callejón sin salida hacía que buscara
  // un camino alternativo (a veces mucho más largo) en vez de simplemente entrar
  // y retroceder por la misma calle — que es justo lo que hace un camión
  // recolector real en un callejón sin salida.
  const url = `${OSRM_URL}/${coords}?geometries=geojson&overview=full&steps=false&continue_straight=false`;

  for (let attempt = 0; attempt <= OSRM_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) throw new Error('OSRM: sin rutas en la respuesta');

      return {
        coordinates: route.geometry.coordinates as [number, number][],
        distance: route.distance,
        duration: route.duration,
      };
    } catch {
      if (attempt < OSRM_RETRIES) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

/**
 * Reordena `waypoints` para minimizar el recorrido total, usando el servicio
 * "trip" de OSRM (resuelve un TSP aproximado). El primer punto queda fijo
 * como inicio (`source=first`) — normalmente es donde arranca el camión —
 * y el resto se reordena para no cruzar la ruta sobre sí misma ni pegar
 * saltos entre puntos lejanos por un orden agregado a mano. No es un
 * "roundtrip": no vuelve al punto de partida al final.
 */
export async function optimizeWaypointOrder<T extends RouteWaypoint>(waypoints: T[]): Promise<T[] | null> {
  if (waypoints.length < 3) return waypoints;

  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&geometries=geojson`;

  for (let attempt = 0; attempt <= OSRM_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      const tripWaypoints = data.waypoints as { waypoint_index: number }[] | undefined;
      if (!tripWaypoints || tripWaypoints.length !== waypoints.length) throw new Error('OSRM trip: respuesta inválida');

      // `tripWaypoints[i]` corresponde a `waypoints[i]` (mismo orden de entrada) y
      // trae la posición que le tocó en el recorrido optimizado.
      const ordered = new Array<T>(waypoints.length);
      tripWaypoints.forEach((tw, i) => { ordered[tw.waypoint_index] = waypoints[i]; });
      return ordered;
    } catch {
      if (attempt < OSRM_RETRIES) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

/** Índice del punto de `coordinates` (formato [lng,lat]) más cercano a `target`. */
export function nearestPointIndex(
  coordinates: [number, number][],
  target: { lng: number; lat: number },
): number {
  let bestIndex = 0;
  let bestDist = Infinity;
  coordinates.forEach(([lng, lat], i) => {
    const d = (lng - target.lng) ** 2 + (lat - target.lat) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  });
  return bestIndex;
}

/**
 * Índice del punto de `coordinates` más cercano a `target`, buscando SOLO
 * desde `fromIndex` en adelante — para marcar el tramo ya recorrido por el
 * camión sin que una calle que se cruza consigo misma lo haga "retroceder"
 * a un tramo anterior.
 */
export function nearestForwardPointIndex(
  coordinates: [number, number][],
  target: { lng: number; lat: number },
  fromIndex: number,
): number {
  let bestIndex = fromIndex;
  let bestDist = Infinity;
  for (let i = fromIndex; i < coordinates.length; i++) {
    const [lng, lat] = coordinates[i];
    const d = (lng - target.lng) ** 2 + (lat - target.lat) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export interface PointDistance {
  index: number;
  distance: number;
  duration: number;
}

export async function calculateDistances(
  origin: { lng: number; lat: number },
  destinations: { lng: number; lat: number }[],
): Promise<PointDistance[]> {
  if (destinations.length === 0) return [];

  const coords = `${origin.lng},${origin.lat};${destinations.map((d) => `${d.lng},${d.lat}`).join(';')}`;
  const url = `${OSRM_URL}/table/v1/driving/${coords}?sources=0&annotations=duration,distance`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.durations?.[0]) return [];

    return data.durations[0].map((duration: number | null, i: number) => ({
      index: i,
      distance: data.distances?.[0]?.[i] ?? 0,
      duration: duration ?? Infinity,
    }));
  } catch {
    return [];
  }
}

export async function findNearestByRoad(
  origin: { lng: number; lat: number },
  destinations: { lng: number; lat: number }[],
): Promise<{ index: number; distance: number; duration: number } | null> {
  const distances = await calculateDistances(origin, destinations);
  if (distances.length === 0) return null;

  let nearest = distances[0];
  for (const d of distances) {
    if (d.duration < nearest.duration) nearest = d;
  }
  return nearest;
}
