'use client';

import { useEffect, useRef, useCallback } from 'react';
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
}

export interface MapRoute {
  id: string;
  points: [number, number][];
  color?: string;
  label?: string;
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
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (lng: number, lat: number) => void;
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
  el.className = 'flex flex-col items-center cursor-pointer';
  const labelBg = darkMode ? '#212120' : '#ffffff';
  const labelText = darkMode ? '#e5e2df' : '#1c1c1a';
  el.innerHTML = `
    <div style="background:${marker.color ?? '#154212'}; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid ${darkMode ? '#363635' : 'white'};">
      <span class="material-symbols-outlined" style="font-size:20px;">${marker.icon ?? 'location_on'}</span>
    </div>
    ${!marker.hideLabel && marker.label ? `<span style="background:${labelBg}; color:${labelText}; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; margin-top:4px; box-shadow:0 1px 4px rgba(0,0,0,0.2); white-space:nowrap;">${marker.label}</span>` : ''}
  `;
  if (onClick) el.addEventListener('click', onClick);
  return el;
}

function syncMarkers(
  map: maplibregl.Map,
  markers: MapMarker[],
  markersRef: React.MutableRefObject<maplibregl.Marker[]>,
  darkMode: boolean,
  onMarkerClick?: (marker: MapMarker) => void,
  followMarkerId?: string,
) {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];

  markers.forEach((marker) => {
    const m = new maplibregl.Marker({
      element: createMarkerEl(marker, darkMode, onMarkerClick ? () => onMarkerClick(marker) : undefined),
    })
      .setLngLat([marker.lng, marker.lat])
      .addTo(map);
    markersRef.current.push(m);
  });

  // Si hay un marker seguido, no hacer fitBounds — el efecto followMarkerId lo maneja
  if (followMarkerId) return;

  if (markers.length >= 2) {
    const bounds = markers.reduce(
      (b, m) => b.extend([m.lng, m.lat]),
      new maplibregl.LngLatBounds([markers[0].lng, markers[0].lat], [markers[0].lng, markers[0].lat]),
    );
    map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
  } else if (markers.length === 1) {
    map.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 15 });
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
    const coords = route.points.map((p) => [p[0], p[1]] as [number, number]);

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
      paint: { 'line-color': outlineColor, 'line-width': 10, 'line-opacity': 0.5 },
    });

    map.addLayer({
      id,
      type: 'line',
      source: id,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': color, 'line-width': 6, 'line-opacity': 1 },
    });

    // Directional arrows along the route
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
  onMarkerClick,
  onMapClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const loadedRef = useRef(false);
  const pendingMarkers = useRef<MapMarker[]>([]);
  const pendingRoutes = useRef<MapRoute[]>([]);
  const darkModeRef = useRef(isDarkMode());
  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  // eslint-disable-next-line react-hooks/refs
  onMapClickRef.current = onMapClick;
  // eslint-disable-next-line react-hooks/refs
  onMarkerClickRef.current = onMarkerClick;

  // Track dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      darkModeRef.current = isDarkMode();
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
    syncMarkers(map, markers, markersRef, darkModeRef.current, onMarkerClick, followMarkerId);
    if (pendingRoutes.current.length > 0) {
      syncRoutes(map, pendingRoutes.current, darkModeRef.current);
      pendingRoutes.current = [];
    }
  }, [markers, onMarkerClick, followMarkerId]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const darkMode = isDarkMode();
    darkModeRef.current = darkMode;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: darkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
      center,
      zoom,
      attributionControl: false,
      interactive,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('click', (e) => {
      onMapClickRef.current?.(e.lngLat.lng, e.lngLat.lat);
    });

    map.on('load', () => {
      loadedRef.current = true;
      if (pendingMarkers.current.length > 0) {
        syncMarkers(map, pendingMarkers.current, markersRef, darkModeRef.current, onMarkerClickRef.current);
        pendingMarkers.current = [];
      }
      if (pendingRoutes.current.length > 0) {
        syncRoutes(map, pendingRoutes.current, darkModeRef.current);
        pendingRoutes.current = [];
      }
    });

    mapRef.current = map;

    return () => {
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
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      pendingMarkers.current = markers;
      return;
    }
    syncMarkers(map, markers, markersRef, darkModeRef.current, onMarkerClick, followMarkerId);
  }, [markers, onMarkerClick, followMarkerId]);

  // Routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) {
      pendingRoutes.current = routes;
      return;
    }
    syncRoutes(map, routes, darkModeRef.current);
  }, [routes]);

  // Seguir un marker específico con animación suave
  useEffect(() => {
    if (!followMarkerId) return;
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const target = markers.find((m) => m.id === followMarkerId);
    if (!target) return;
    map.easeTo({ center: [target.lng, target.lat], zoom: Math.max(map.getZoom(), 16), duration: 800 });
  }, [followMarkerId, markers]);

  return (
    <div ref={containerRef} style={{ width: '100%', height, minHeight: '200px' }} />
  );
}
