const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
// 2.5s era demasiado ajustado: una ruta con muchas paradas (más waypoints =
// más tiempo de cómputo en OSRM) sobre una red lenta lo superaba seguido,
// y como `fetchRoadPath` solo se llama UNA VEZ al iniciar la demo (sin
// reintento), eso significaba caer a `buildLinearPath` (líneas rectas
// atravesando manzanas) para TODA la simulación, no solo para el dibujo.
const FETCH_TIMEOUT_MS = 8000;
const FETCH_RETRIES = 1;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoadPath {
  coordinates: LatLng[];
  /** Distancia (m) de cada tramo ENTRE waypoints consecutivos, en el mismo orden que se pidieron — viene directo de `routes[0].legs[].distance` de OSRM, sin adivinar nada por cercanía. */
  legDistances: number[];
}

/**
 * Trae el trayecto real (siguiendo calles) entre waypoints vía OSRM.
 * Se usa solo al iniciar una simulación de demo. Reintenta una vez ante un
 * fallo de red transitorio antes de rendirse — el llamador debe caer a
 * interpolación lineal (líneas rectas) solo si esto devuelve null tras
 * agotar los reintentos.
 */
export async function fetchRoadPath(waypoints: LatLng[]): Promise<RoadPath | null> {
  if (waypoints.length < 2) return null;

  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  // continue_straight=false: permite giros en U en los waypoints — necesario
  // para paradas en callejones sin salida, donde el camión real entra y
  // retrocede por la misma calle en vez de rodear por otra (ver lib/routing.ts).
  const url = `${OSRM_URL}/${coords}?geometries=geojson&overview=full&steps=false&continue_straight=false`;

  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      const coordinates = data?.routes?.[0]?.geometry?.coordinates as
        | [number, number][]
        | undefined;
      const legs = data?.routes?.[0]?.legs as { distance: number }[] | undefined;
      if (!coordinates || coordinates.length === 0 || !legs) throw new Error('OSRM: sin ruta en la respuesta');

      return {
        coordinates: coordinates.map(([lng, lat]) => ({ lat, lng })),
        legDistances: legs.map((l) => l.distance),
      };
    } catch {
      if (attempt === FETCH_RETRIES) return null;
      // Backoff corto antes de reintentar — el OSRM público (rate-limited)
      // suele responder al segundo intento. Caer al trazado lineal significa
      // líneas rectas atravesando manzanas durante TODA la demo, así que vale
      // la pena insistir un poco más antes de rendirse.
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
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

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function cumulativeDistances(path: LatLng[]): number[] {
  const cum = [0];
  for (let i = 1; i < path.length; i++) {
    cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]));
  }
  return cum;
}

/**
 * Densifica `path` a un paso de ~`stepMeters` PRESERVANDO todos sus vértices
 * originales (las esquinas de OSRM) y subdividiendo solo los tramos rectos
 * más largos que ese paso. Esta es la diferencia clave con remuestrear a N
 * puntos equiespaciados: al remuestrear por distancia, un vértice de esquina
 * que cae ENTRE dos muestras se descarta, y la recta que une esas dos
 * muestras corta la esquina (atraviesa la manzana). Aquí ningún vértice se
 * pierde, así que el trazado sigue la calle giro por giro, y además queda
 * suficientemente denso para que el camión avance a velocidad pareja.
 */
export function densifyPath(path: LatLng[], stepMeters: number): LatLng[] {
  if (path.length < 2 || stepMeters <= 0) return [...path];

  const result: LatLng[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const segDist = haversineMeters(a, b);
    const steps = Math.max(1, Math.ceil(segDist / stepMeters));
    // j llega hasta `steps` (t=1) → el vértice original `b` (la esquina)
    // siempre queda incluido exactamente, nunca interpolado ni salteado.
    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      result.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
    }
  }
  return result;
}

/** Distancia total (m) recorrida por `path`. */
export function pathTotalDistance(path: LatLng[]): number {
  const cum = cumulativeDistances(path);
  return cum[cum.length - 1] ?? 0;
}

/**
 * Índice dentro de `path` (ya densificado) cuya distancia acumulada desde el
 * inicio alcanza `distanceFromStart`. Se usa una distancia conocida de
 * antemano (no una búsqueda de "punto más cercano") para que cada parada
 * quede mapeada EXACTAMENTE en el orden en que se visita — buscar el punto
 * más cercano en una cuadrícula de calles puede confundirse con otro tramo
 * cercano y desordenar las paradas. El recorrido es monótono, así que
 * preserva el orden de las paradas.
 */
export function pathIndexAtDistance(path: LatLng[], distanceFromStart: number): number {
  if (path.length <= 1 || distanceFromStart <= 0) return 0;
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    acc += haversineMeters(path[i - 1], path[i]);
    if (acc >= distanceFromStart) return i;
  }
  return path.length - 1;
}
