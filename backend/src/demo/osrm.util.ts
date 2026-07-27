const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const FETCH_TIMEOUT_MS = 2500;

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Trae el trayecto real (siguiendo calles) entre waypoints vía OSRM.
 * Se usa solo al iniciar una simulación de demo, con un timeout corto para
 * no depender de una red externa en vivo durante una presentación — el
 * llamador debe caer a interpolación lineal si esto devuelve null.
 */
export async function fetchRoadPath(waypoints: LatLng[]): Promise<LatLng[] | null> {
  if (waypoints.length < 2) return null;

  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const url = `${OSRM_URL}/${coords}?geometries=geojson&overview=full&steps=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    const coordinates = data?.routes?.[0]?.geometry?.coordinates as
      | [number, number][]
      | undefined;
    if (!coordinates || coordinates.length === 0) return null;

    return coordinates.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Interpola linealmente entre paradas consecutivas (fallback sin red). */
export function buildLinearPath(waypoints: LatLng[], pointsPerSegment = 20): LatLng[] {
  const path: LatLng[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      path.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
    }
  }
  path.push(waypoints[waypoints.length - 1]);
  return path;
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Índice del punto de `path` más cercano a `target`. */
export function nearestPathIndex(path: LatLng[], target: LatLng): number {
  let bestIndex = 0;
  let bestDist = Infinity;
  path.forEach((p, i) => {
    const d = haversineMeters(p, target);
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  });
  return bestIndex;
}

/** Remuestrea `path` a exactamente `count` puntos (mantiene inicio y fin). */
export function resamplePath(path: LatLng[], count: number): LatLng[] {
  if (path.length === 0 || count <= 0) return [];
  if (count === 1) return [path[0]];
  const result: LatLng[] = [];
  for (let i = 0; i < count; i++) {
    const srcIndex = Math.round((i / (count - 1)) * (path.length - 1));
    result.push(path[srcIndex]);
  }
  return result;
}

/** Traduce un índice del path original al índice equivalente tras resamplePath. */
export function mapIndexAfterResample(
  originalIndex: number,
  originalLength: number,
  newLength: number,
): number {
  if (originalLength <= 1 || newLength <= 1) return 0;
  return Math.round((originalIndex / (originalLength - 1)) * (newLength - 1));
}
