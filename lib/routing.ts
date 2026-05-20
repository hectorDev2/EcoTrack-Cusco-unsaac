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

export async function calculateRoute(waypoints: RouteWaypoint[]): Promise<CalculatedRoute | null> {
  if (waypoints.length < 2) return null;

  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const url = `${OSRM_URL}/${coords}?geometries=geojson&overview=full&steps=false`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes?.[0]) return null;

    const route = data.routes[0];
    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distance: route.distance,
      duration: route.duration,
    };
  } catch {
    return null;
  }
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
