'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  color?: string;
  icon?: string;
  label?: string;
  description?: string;
  hideLabel?: boolean;
  /** Si es true, el usuario puede arrastrar el marker a otra posición */
  draggable?: boolean;
  /**
   * Si se pasa, un cambio de posición de este marker (mismo id, mismo
   * color/icon/label) se anima suavemente durante esta cantidad de ms en vez
   * de saltar instantáneamente — pensado para el camión en /mapa, cuyo
   * polling es mucho más lento que el movimiento real/simulado.
   */
  moveDurationMs?: number;
  /**
   * Polyline de calles reales (la misma que se dibuja como MapRoute) sobre
   * la que este marker debe desplazarse mientras se anima, en vez de ir en
   * línea recta entre la posición anterior y la nueva. La búsqueda del punto
   * más cercano se hace SOLO hacia adelante desde el último índice conocido
   * (ver TrackedMarker.pathIndex en syncMarkers) — nunca sobre todo el
   * trayecto — para no confundirse con un tramo anterior en una calle que se
   * cruza consigo misma.
   */
  pathCoords?: [number, number][];
}

export interface MapRoute {
  id: string;
  points: [number, number][];
  color?: string;
  label?: string;
  /** Dibuja el tramo como línea discontinua — pensado para marcar el trayecto ya recorrido por el camión, distinto del que falta por recorrer. */
  dashed?: boolean;
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRoute[];
  height?: string;
  interactive?: boolean;
  /** ID del marker que la cámara debe seguir suavemente cuando se mueve */
  followMarkerId?: string;
  /** ID del marker sobre el que se debe anclar el tooltip flotante */
  activeMarkerId?: string;
  /** Contenido del tooltip, mostrado encima del marker activo */
  tooltipContent?: React.ReactNode;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (lng: number, lat: number) => void;
  /** Se dispara al soltar un marker arrastrable, con su nueva posición */
  onMarkerDragEnd?: (markerId: string, lng: number, lat: number) => void;
  /**
   * Cambiar este valor (p. ej. un contador) fuerza un fitBounds explícito
   * alrededor de `fitBoundsMarkerIds` (y `fitBoundsRoutePoints`, si se pasa),
   * sin depender de que cambie el conjunto de markers.
   */
  fitBoundsSignal?: number;
  /** IDs de markers a incluir en el fitBounds disparado por fitBoundsSignal */
  fitBoundsMarkerIds?: string[];
  /** Puntos de ruta a incluir también en ese fitBounds */
  fitBoundsRoutePoints?: [number, number][];
  /** Cuando es true, el auto-fitBounds/flyTo al cambiar markers se salta */
  disableAutoFit?: boolean;
}

const CUSCO_CENTER: [number, number] = [-71.9675, -13.5320];
const DARK_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function createMarkerEl(marker: MapMarker, darkMode: boolean, onClick?: () => void): HTMLDivElement {
  const el = document.createElement('div');
  el.className = `flex flex-col items-center ${marker.draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`;
  const labelBg = darkMode ? '#212120' : '#ffffff';
  const labelText = darkMode ? '#e5e2df' : '#1c1c1a';
  const borderColor = darkMode ? '#363635' : 'white';

  const icon = document.createElement('div');
  icon.style.cssText = `background:${marker.color ?? '#154212'}; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid ${borderColor};`;
  icon.innerHTML = `<span class="material-symbols-outlined" style="font-size:20px;">${marker.icon ?? 'location_on'}</span>`;
  el.appendChild(icon);

  if (marker.label) {
    const label = document.createElement('span');
    label.textContent = marker.label;
    label.style.cssText = `background:${labelBg}; color:${labelText}; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; margin-top:4px; box-shadow:0 1px 4px rgba(0,0,0,0.2); white-space:nowrap;`;
    if (marker.hideLabel) {
      label.style.display = 'none';
      el.addEventListener('mouseenter', () => { label.style.display = ''; });
      el.addEventListener('mouseleave', () => { label.style.display = 'none'; });
    }
    el.appendChild(label);
  }

  if (onClick) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
  }
  return el;
}

// Categoría usada para decidir si hay que recentrar el mapa. Se agrupa por
// tipo (no por id exacto) para que, por ejemplo, cambiar CUÁLES son los 4
// vertederos más cercanos (mismo conteo, ids distintos) no dispare este
// fitBounds genérico — eso ya lo maneja fitBoundsSignal de forma explícita,
// y disparar ambos a la vez se sentía como "dos saltos" de cámara.
function fitTriggerCategory(id: string): string | null {
  if (id === 'origin') return null;
  // El camión (real o de demo) y las paradas de su ruta aparecen/desaparecen
  // de forma asíncrona (polling, datos de la demo llegando de a poco) — si
  // contaran para el fitBounds genérico, cada aparición recentraría el mapa
  // e incluiría el marker "origin" (Mi Ubicación) en el encuadre, dando la
  // sensación de que el mapa "manda a mi ubicación" solo. Se excluyen.
  if (id.startsWith('truck-')) return null;
  if (id.startsWith('route-stop-')) return null;
  if (id.startsWith('inc-')) return 'inc';
  return 'pickup';
}

function fitTriggerKey(markers: MapMarker[]): string {
  const counts: Record<string, number> = {};
  markers.forEach((m) => {
    const cat = fitTriggerCategory(m.id);
    if (!cat) return;
    counts[cat] = (counts[cat] ?? 0) + 1;
  });
  return Object.keys(counts)
    .sort()
    .map((k) => `${k}:${counts[k]}`)
    .join('|');
}

interface TrackedMarker {
  id: string;
  marker: maplibregl.Marker;
  color?: string;
  icon?: string;
  label?: string;
  hideLabel?: boolean;
  draggable?: boolean;
  /** Generación de la animación en curso, para poder cancelar una anterior */
  animGen: number;
  /**
   * Índice sobre `pathCoords` donde EMPEZÓ el segmento de la animación en
   * curso (no donde terminó) — un piso seguro, ya que el marker nunca está
   * visualmente antes de él, ni siquiera si esa animación se interrumpió a
   * mitad de camino. Arranca en null (sin restricción) y solo avanza hacia
   * adelante, para no confundirse con un tramo anterior de una calle que se
   * cruza consigo misma. Ver animateMarkerTo.
   */
  pathIndex: number | null;
  /** Marca de tiempo de la última animación — ver `animateMarkerTo`. */
  lastMoveAt: number | null;
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Punto de `path` más cercano a `target`, buscando SOLO desde `fromIndex` en adelante. */
// Ventana máxima (m) de avance por actualización. Buscar el punto más cercano
// hacia adelante SIN tope hace que, en una ruta que se cruza consigo misma
// (cuadrícula de calles, ida y vuelta por la misma avenida), el punto más
// cercano a la posición del camión sea a veces un tramo MUCHO más adelante
// donde la ruta vuelve a pasar cerca — y el marcador se teletransporta ahí,
// saltándose media ruta. Acotar la búsqueda a un avance razonable lo evita.
const MAX_FORWARD_ADVANCE_M = 400;

function nearestForwardIndex(path: [number, number][], target: [number, number], fromIndex: number): number {
  let best = fromIndex;
  let bestDist = Infinity;
  let traveled = 0;
  for (let i = fromIndex; i < path.length; i++) {
    if (i > fromIndex) {
      traveled += haversineMeters(path[i - 1], path[i]);
      if (traveled > MAX_FORWARD_ADVANCE_M) break;
    }
    const d = haversineMeters(path[i], target);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

function pathSegmentDistances(points: [number, number][]): number[] {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + haversineMeters(points[i - 1], points[i]));
  }
  return cum;
}

function pointAtDistance(points: [number, number][], cum: number[], dist: number): [number, number] {
  const total = cum[cum.length - 1];
  if (total <= 0) return points[0];
  const target = Math.max(0, Math.min(dist, total));
  let seg = 0;
  while (seg < cum.length - 2 && cum[seg + 1] < target) seg++;
  const segStart = cum[seg];
  const segEnd = cum[seg + 1];
  const t = segEnd > segStart ? (target - segStart) / (segEnd - segStart) : 0;
  const a = points[seg];
  const b = points[seg + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Anima un marker existente hacia una nueva posición en vez de saltar.
 * Si se pasa `pathCoords`, camina SOBRE esa polyline (la misma calle
 * dibujada) en vez de ir en línea recta — pero el punto de entrada al
 * trayecto se busca solo hacia adelante desde `tm.pathIndex` (nunca en todo
 * el trayecto desde cero), así una calle que se cruza consigo misma no hace
 * que el camión retroceda a un tramo anterior. Si se pasa `map` (el marker
 * seguido por la cámara), el centro del mapa se mueve en el MISMO frame que
 * el marker.
 */
function animateMarkerTo(
  tm: TrackedMarker,
  toLng: number,
  toLat: number,
  durationMs: number,
  map?: maplibregl.Map,
  pathCoords?: [number, number][],
) {
  const gen = ++tm.animGen;
  const start = performance.now();
  const from = tm.marker.getLngLat();
  const fromLng = from.lng;
  const fromLat = from.lat;
  // Zoom objetivo fijado una sola vez al arrancar la animación — si se
  // recalculara en cada frame con map.getZoom(), pelearía contra cualquier
  // zoom manual del usuario mientras el camión está en movimiento.
  const targetZoom = map ? Math.max(map.getZoom(), 16) : undefined;

  // La duración NO puede ser fija: el backend avanza una distancia real
  // constante por tick, pero si un poll tarda más o se saltó un tick, la
  // distancia a recorrer en ESTA actualización puede ser mayor. Usar la
  // duración fija de todos modos comprime esa distancia extra en el mismo
  // tiempo → velocidad disparada, exactamente lo que se ve como "vuela".
  // En cambio, se usa el tiempo real transcurrido desde el último
  // movimiento (acotado entre 0.5x y 3x el intervalo nominal) para que la
  // velocidad percibida se mantenga aproximadamente constante.
  const now0 = performance.now();
  const elapsed = tm.lastMoveAt != null ? now0 - tm.lastMoveAt : durationMs;
  // Buffer de suavizado: la animación dura un poco MÁS que el intervalo real
  // entre updates, así el marker sigue deslizándose cuando llega la próxima
  // posición y nunca se congela unos ms al final de cada segmento (ese
  // micro-freeze en el borde era lo que se veía "a saltos"). El marker queda
  // ~15% detrás de la posición real —imperceptible—, a cambio de movimiento
  // continuo. El lag es acotado: cada animación apunta siempre al último
  // destino recibido, no se acumula.
  const SMOOTH_BUFFER = 1.15;
  const actualDuration =
    Math.min(Math.max(elapsed, durationMs * 0.5), durationMs * 3) * SMOOTH_BUFFER;
  tm.lastMoveAt = now0;

  let segment: { points: [number, number][]; cum: number[] } | null = null;
  if (pathCoords && pathCoords.length >= 2) {
    // `tm.pathIndex` se guarda como el índice de INICIO del segmento en
    // curso (no el de destino) precisamente para poder usarlo como piso
    // seguro de búsqueda en la próxima llamada: si esta animación se
    // interrumpe a mitad de camino (llega una posición nueva antes de que
    // termine — frecuente, porque el tick del backend y la duración de la
    // animación solo coinciden aproximadamente), el marker sigue
    // visualmente en algún punto ENTRE el índice de inicio y el de destino,
    // nunca antes del de inicio. Guardar el de destino ahí hacía que la
    // siguiente animación arrancara desde un punto por delante de donde el
    // camión realmente estaba, saltando en línea recta el tramo intermedio
    // — eso es lo que se veía como "volar" cortando una esquina.
    const startIndex = nearestForwardIndex(pathCoords, [fromLng, fromLat], tm.pathIndex ?? 0);
    const endIndex = nearestForwardIndex(pathCoords, [toLng, toLat], startIndex);
    if (endIndex > startIndex) {
      const points: [number, number][] = [[fromLng, fromLat], ...pathCoords.slice(startIndex + 1, endIndex + 1)];
      points[points.length - 1] = [toLng, toLat];
      segment = { points, cum: pathSegmentDistances(points) };
    }
    tm.pathIndex = startIndex;
  }

  function step(now: number) {
    if (tm.animGen !== gen) return; // una animación más nueva la reemplazó
    const t = Math.min((now - start) / actualDuration, 1);
    let lng: number, lat: number;
    if (segment) {
      [lng, lat] = pointAtDistance(segment.points, segment.cum, segment.cum[segment.cum.length - 1] * t);
    } else {
      lng = fromLng + (toLng - fromLng) * t;
      lat = fromLat + (toLat - fromLat) * t;
    }
    tm.marker.setLngLat([lng, lat]);
    if (map) map.jumpTo({ center: [lng, lat], zoom: targetZoom });
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function syncMarkers(
  map: maplibregl.Map,
  markers: MapMarker[],
  markersRef: React.MutableRefObject<TrackedMarker[]>,
  darkMode: boolean,
  onMarkerClick?: (marker: MapMarker) => void,
  followMarkerId?: string,
  shouldFit = true,
  onMarkerDragEnd?: (markerId: string, lng: number, lat: number) => void,
) {
  const existing = new Map(markersRef.current.map((tm) => [tm.id, tm]));
  const next: TrackedMarker[] = [];

  markers.forEach((marker) => {
    const prev = existing.get(marker.id);
    const sameContent =
      prev &&
      prev.color === marker.color &&
      prev.icon === marker.icon &&
      prev.label === marker.label &&
      prev.hideLabel === marker.hideLabel &&
      prev.draggable === marker.draggable;

    if (prev && sameContent) {
      // Solo cambió la posición: mover el marker existente (animado si se
      // pidió) en vez de recrearlo — evita el "salto"/parpadeo visual.
      existing.delete(marker.id);
      const { lng, lat } = prev.marker.getLngLat();
      if (marker.moveDurationMs && (lng !== marker.lng || lat !== marker.lat)) {
        animateMarkerTo(
          prev,
          marker.lng,
          marker.lat,
          marker.moveDurationMs,
          marker.id === followMarkerId ? map : undefined,
          marker.pathCoords,
        );
      } else {
        prev.marker.setLngLat([marker.lng, marker.lat]);
      }
      next.push(prev);
      return;
    }

    // Contenido nuevo o distinto (color/icon/label cambiaron): (re)crear.
    if (prev) {
      existing.delete(marker.id);
      prev.marker.remove();
    }

    const m = new maplibregl.Marker({
      element: createMarkerEl(marker, darkMode, onMarkerClick ? () => onMarkerClick(marker) : undefined),
      draggable: marker.draggable ?? false,
    })
      .setLngLat([marker.lng, marker.lat])
      .addTo(map);
    if (marker.draggable && onMarkerDragEnd) {
      m.on('dragend', () => {
        const lngLat = m.getLngLat();
        onMarkerDragEnd(marker.id, lngLat.lng, lngLat.lat);
      });
    }
    next.push({
      id: marker.id,
      marker: m,
      color: marker.color,
      icon: marker.icon,
      label: marker.label,
      hideLabel: marker.hideLabel,
      draggable: marker.draggable,
      animGen: 0,
      pathIndex: null,
      lastMoveAt: null,
    });
  });

  // Lo que quedó en `existing` ya no está en el nuevo set de markers.
  existing.forEach((tm) => tm.marker.remove());
  markersRef.current = next;

  // Si hay un marker seguido, no hacer fitBounds — el efecto followMarkerId lo maneja
  if (followMarkerId) return;
  // Solo recentrar cuando cambia el conjunto de markers (no en cada acción del usuario)
  if (!shouldFit) return;

  // Mismo filtro que fitTriggerCategory: el encuadre genérico no debe incluir
  // "origin" (Mi Ubicación) ni el camión/paradas de la ruta — si se colara acá
  // aunque el trigger lo haya excluido, el mapa igual saltaría a esos puntos.
  const fitMarkers = markers.filter((m) => fitTriggerCategory(m.id) !== null);

  if (fitMarkers.length >= 2) {
    const bounds = fitMarkers.reduce(
      (b, m) => b.extend([m.lng, m.lat]),
      new maplibregl.LngLatBounds([fitMarkers[0].lng, fitMarkers[0].lat], [fitMarkers[0].lng, fitMarkers[0].lat]),
    );
    map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
  } else if (fitMarkers.length === 1) {
    map.flyTo({ center: [fitMarkers[0].lng, fitMarkers[0].lat], zoom: 15 });
  }
}

function ensureArrowImage(map: maplibregl.Map) {
  if (map.hasImage('route-direction-arrow')) return;
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Arrow pointing right (MapLibre rotates it to follow the line direction)
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.beginPath();
  ctx.moveTo(5, 6);
  ctx.lineTo(19, 12);
  ctx.lineTo(5, 18);
  ctx.lineTo(8, 12);
  ctx.closePath();
  ctx.fill();
  const imageData = ctx.getImageData(0, 0, size, size);
  map.addImage('route-direction-arrow', { width: size, height: size, data: imageData.data }, { sdf: true });
}

const M_PER_DEG_LAT = 111320;
const OVERLAP_OFFSET_METERS = 4;

/**
 * Cuando la ruta pasa dos veces por la misma calle (p. ej. un camión que
 * entra a un callejón sin salida y retrocede — ver continue_straight=false
 * en lib/routing.ts), el segundo paso queda dibujado exactamente encima del
 * primero y no se distingue en el mapa. Acá detectamos coordenadas repetidas
 * y desplazamos las repeticiones perpendicularmente al sentido de avance,
 * para que ambos pasos se vean como dos líneas paralelas en vez de una sola.
 */
function offsetOverlappingSegments(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;

  const seen = new Map<string, number>();
  const keyOf = (p: [number, number]) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;

  return points.map((p, i) => {
    const key = keyOf(p);
    const occurrence = seen.get(key) ?? 0;
    seen.set(key, occurrence + 1);
    if (occurrence === 0) return p;

    const prev = points[Math.max(i - 1, 0)];
    const next = points[Math.min(i + 1, points.length - 1)];
    const latRad = (p[1] * Math.PI) / 180;
    const mPerDegLng = M_PER_DEG_LAT * Math.cos(latRad) || 1;

    // Tangente local en metros, para obtener la normal perpendicular
    const dx = (next[0] - prev[0]) * mPerDegLng;
    const dy = (next[1] - prev[1]) * M_PER_DEG_LAT;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dy / len;
    const ny = -dx / len;

    return [
      p[0] + (nx * OVERLAP_OFFSET_METERS) / mPerDegLng,
      p[1] + (ny * OVERLAP_OFFSET_METERS) / M_PER_DEG_LAT,
    ] as [number, number];
  });
}

function syncRoutes(map: maplibregl.Map, routes: MapRoute[], darkMode: boolean) {
  const existingSources = map.getStyle()?.sources ?? {};
  Object.keys(existingSources).forEach((id) => {
    if (id.startsWith('route-')) {
      if (map.getLayer(`${id}-arrows`)) map.removeLayer(`${id}-arrows`);
      if (map.getLayer(`${id}-outline`)) map.removeLayer(`${id}-outline`);
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }
  });

  const outlineColor = darkMode ? '#363635' : '#ffffff';

  ensureArrowImage(map);

  routes.forEach((route) => {
    const id = `route-${route.id}`;
    const color = route.color ?? '#154212';
    const coords = offsetOverlappingSegments(route.points.map((p) => [p[0], p[1]] as [number, number]));

    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      },
    });

    map.addLayer({
      id: `${id}-outline`,
      type: 'line',
      source: id,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: route.dashed
        ? { 'line-color': outlineColor, 'line-width': 8, 'line-opacity': 0.5, 'line-dasharray': [2, 2] }
        : { 'line-color': outlineColor, 'line-width': 10, 'line-opacity': 0.5 },
    });

    map.addLayer({
      id,
      type: 'line',
      source: id,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: route.dashed
        ? { 'line-color': color, 'line-width': 5, 'line-opacity': 0.6, 'line-dasharray': [2, 2] }
        : { 'line-color': color, 'line-width': 6, 'line-opacity': 1 },
    });

    // Flechas de dirección solo en el tramo por recorrer — en el tramo ya
    // recorrido (discontinuo) no aportan y compiten visualmente con el rastro.
    if (!route.dashed) {
      map.addLayer({
        id: `${id}-arrows`,
        type: 'symbol',
        source: id,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 80,
          'icon-image': 'route-direction-arrow',
          'icon-size': 0.75,
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
        paint: {
          'icon-color': '#ffffff',
          'icon-opacity': 0.95,
        },
      });
    }
  });
}

export default function MapView({
  center = CUSCO_CENTER,
  zoom = 13,
  markers = [],
  routes = [],
  height = '100%',
  interactive = true,
  followMarkerId,
  activeMarkerId,
  tooltipContent,
  onMarkerClick,
  onMapClick,
  onMarkerDragEnd,
  fitBoundsSignal,
  fitBoundsMarkerIds,
  fitBoundsRoutePoints,
  disableAutoFit,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [darkMode, setDarkMode] = useState(() => isDarkMode());
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<TrackedMarker[]>([]);
  const loadedRef = useRef(false);
  const pendingMarkers = useRef<MapMarker[]>([]);
  const pendingRoutes = useRef<MapRoute[]>([]);
  const darkModeRef = useRef(isDarkMode());
  const prevFitIdsRef = useRef<string | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onMarkerDragEndRef = useRef(onMarkerDragEnd);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onMarkerClickRef.current = onMarkerClick;
    onMarkerDragEndRef.current = onMarkerDragEnd;
  }, [onMapClick, onMarkerClick, onMarkerDragEnd]);

  // Track dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = isDarkMode();
      darkModeRef.current = dark;
      setDarkMode(dark);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const _updateAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    syncMarkers(map, markers, markersRef, darkModeRef.current, onMarkerClick, followMarkerId, !disableAutoFit, onMarkerDragEnd);
    if (pendingRoutes.current.length > 0) {
      syncRoutes(map, pendingRoutes.current, darkModeRef.current);
      pendingRoutes.current = [];
    }
  }, [markers, onMarkerClick, followMarkerId, onMarkerDragEnd, disableAutoFit]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const dark = isDarkMode();
    darkModeRef.current = dark;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: dark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
      center,
      zoom,
      attributionControl: false,
      interactive,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const onClick = (e: maplibregl.MapMouseEvent) => {
      onMapClickRef.current?.(e.lngLat.lng, e.lngLat.lat);
    };
    const onLoad = () => {
      loadedRef.current = true;
      if (pendingMarkers.current.length > 0) {
        prevFitIdsRef.current = fitTriggerKey(pendingMarkers.current);
        syncMarkers(map, pendingMarkers.current, markersRef, darkModeRef.current, onMarkerClickRef.current, undefined, true, onMarkerDragEndRef.current);
        pendingMarkers.current = [];
      }
      if (pendingRoutes.current.length > 0) {
        syncRoutes(map, pendingRoutes.current, darkModeRef.current);
        pendingRoutes.current = [];
      }
    };

    map.on('click', onClick);
    map.on('load', onLoad);

    mapRef.current = map;

    return () => {
      map.off('click', onClick);
      map.off('load', onLoad);
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Fly to new center/zoom
  useEffect(() => {
    if (!mapRef.current || !loadedRef.current) return;
    if (markers.length === 0) {
      mapRef.current.flyTo({ center, zoom, duration: 800 });
    }
  }, [center[0], center[1], zoom]);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) {
      markersRef.current.forEach((tm) => tm.marker.remove());
      markersRef.current = [];
      pendingMarkers.current = markers;
      return;
    }
    // Solo recentrar el mapa cuando cambia el conjunto de markers (ids),
    // no cuando solo cambia su color/label por una acción del usuario
    // (p. ej. seleccionar un punto o calcular el más cercano).
    const idsKey = fitTriggerKey(markers);
    const shouldFit = idsKey !== prevFitIdsRef.current && !disableAutoFit;
    prevFitIdsRef.current = idsKey;
    syncMarkers(map, markers, markersRef, darkModeRef.current, onMarkerClick, followMarkerId, shouldFit, onMarkerDragEnd);
  }, [markers, onMarkerClick, followMarkerId, onMarkerDragEnd, disableAutoFit]);

  // Routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) {
      pendingRoutes.current = routes;
      return;
    }
    syncRoutes(map, routes, darkModeRef.current);
  }, [routes]);

  // Salto inicial al empezar a seguir un marker (p. ej. al arrancar la
  // demo). Los movimientos posteriores del mismo marker seguido los mueve
  // la cámara en sincronía con animateMarkerTo (ver syncMarkers) — este
  // efecto NO debe repetirse en cada poll, porque su propio easeTo llegaba
  // mucho antes que el marker (que tarda varios segundos en deslizarse),
  // dando la sensación de que el mapa "volaba" a un lugar vacío.
  useEffect(() => {
    if (!followMarkerId) return;
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const tm = markersRef.current.find((t) => t.id === followMarkerId);
    const target = tm ? tm.marker.getLngLat() : markers.find((m) => m.id === followMarkerId);
    if (!target) return;
    map.easeTo({ center: [target.lng, target.lat], zoom: Math.max(map.getZoom(), 16), duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a propósito solo cuando cambia el ID seguido, no en cada poll de `markers`
  }, [followMarkerId]);

  // Fit explícito (p. ej. centrar entre el origen, los vertederos cercanos
  // y la ruta trazada). Se dispara únicamente cuando cambia fitBoundsSignal,
  // no en cada render, para no pelear con la navegación libre del usuario.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || fitBoundsSignal == null) return;

    const idsSet = fitBoundsMarkerIds ? new Set(fitBoundsMarkerIds) : null;
    const points: [number, number][] = [];
    markers.forEach((m) => {
      if (!idsSet || idsSet.has(m.id)) points.push([m.lng, m.lat]);
    });
    if (fitBoundsRoutePoints) points.push(...fitBoundsRoutePoints);
    if (points.length === 0) return;

    const bounds = points.reduce(
      (b, p) => b.extend(p),
      new maplibregl.LngLatBounds(points[0], points[0]),
    );
    map.fitBounds(bounds, { padding: 70, maxZoom: 16, duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se dispara a propósito solo con fitBoundsSignal
  }, [fitBoundsSignal]);

  // Posición en pantalla del marker activo, para anclar el tooltip
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || !activeMarkerId) {
      setTooltipPos(null);
      return;
    }
    const target = markers.find((m) => m.id === activeMarkerId);
    if (!target) {
      setTooltipPos(null);
      return;
    }

    const update = () => {
      const point = map.project([target.lng, target.lat]);
      setTooltipPos({ x: point.x, y: point.y });
    };
    update();
    map.on('move', update);
    return () => {
      map.off('move', update);
    };
  }, [activeMarkerId, markers]);

  return (
    <div style={{ position: 'relative', width: '100%', height, minHeight: '200px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {tooltipPos && tooltipContent && (
        <div
          style={{
            position: 'absolute',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%) translateY(-16px)',
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
          {tooltipContent}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -6,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${darkMode ? '#212120' : '#ffffff'}`,
            }}
          />
        </div>
      )}
    </div>
  );
}
